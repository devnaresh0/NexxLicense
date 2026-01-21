import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { LicenseService } from '../services/license.service';
import { apiUrl } from 'src/environments/global';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Router } from '@angular/router';
import { LogoutService } from '../services/logout.service';
import { ErrorService } from "../services/error.service";
import { createSHA256 } from 'hash-wasm';

export interface License {
  id: number;
  serialNumber: string;
  domain: string;
  customerName: string;
  apps?: LicenseApp[];
  active?: boolean;
};

interface LicenseApp {
  appType: string | null;
  currentVersion: string | null;
  currentFileName: string | null;
}

interface GroupedLicense {
  id: number;
  serialNumber: string;
  domain: string;
  customerName: string;
  apps: LicenseApp[];
}


@Component({
  selector: 'app-build-upload',
  templateUrl: './build-upload.component.html',
  styleUrls: ['./build-upload.component.css']
}
)
export class BuildUploadComponent implements OnInit {

  form: FormGroup;
  // license data
  licenses: License[] = [];
  groupedLicenses: GroupedLicense[] = [];
  selectedLicenseIds: number[] = [];
  loadingLicenses = false;
  customerOption: string = 'all'; // 'all' or 'select'
  downloadingCsv = false;
  // parse errors per build row (empty string = no error)
  parseErrors: string[] = [];

  constructor(
    private fb: FormBuilder,
    private licenseService: LicenseService,
    private http: HttpClient,
    private router: Router,
    private logoutService: LogoutService,
    private errorService: ErrorService
  ) { }

  ngOnInit() {
    this.form = this.fb.group({
      builds: this.fb.array([this.buildGroup()])
    });

    // initialize parse errors for the initial build row
    this.parseErrors = [''];

    this.fetchLicenses();
  }

  // getter
  get builds(): FormArray {
    return this.form.get('builds') as FormArray;
  }

  // one file-block group
  buildGroup(): FormGroup {
    return this.fb.group({
      version: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      app_type: ['', Validators.required],
      file: [null, Validators.required],
      file_hash: ['', Validators.required]
    });
  }

  // add file block
  addBuild() {
    this.builds.push(this.buildGroup());
    this.parseErrors.push('');
  }

  // remove file block
  removeBuild(i: number) {
    this.builds.removeAt(i);
    this.parseErrors.splice(i, 1);
  }

  // file change
  onFileChange(event: any, index: number) {
    const file: File = event.target.files[0];
    const group = this.builds.at(index);

    // reset previous parse error
    this.parseErrors[index] = '';

    if (!file) {
      return;
    }

    // try to extract app type + version from filename immediately
    const parsed = this.parseFileName(file.name);
    if (parsed) {
      group.patchValue({
        app_type: parsed.appType,
        version: parsed.version
      });
      this.parseErrors[index] = '';
    } else {
      // not recognized -> clear fields and show a warning
      group.patchValue({ app_type: '', version: '' });
      this.parseErrors[index] = 'Could not detect app type/version from filename. Rename file to match expected patterns.';
      this.errorService.showError(`Could not detect type/version from filename: ${file.name}`, 'error');
    }

    // hash async but do not block UI
    this.hashFile(file).then(hash => {
      group.patchValue({
        file: file,
        file_hash: hash
      });
    }).catch(err => {
      this.errorService.showError('Failed to hash file', 'error');
    });
  }

  // fetch customers/licenses
  fetchLicenses() {
    this.loadingLicenses = true;

    this.licenseService.getLicensesWithVersion().subscribe({
      next: (data: License[]) => {
        this.licenses = data;
        this.groupedLicenses = this.groupLicenses(this.licenses);
        this.loadingLicenses = false;
      },
      error: () => {
        this.loadingLicenses = false;
      }
    });
  }
  private groupLicenses(list: any[]): GroupedLicense[] {
    // Backend now returns each license with an `apps` array. Normalize and return directly.
    if (!list || !list.length) {
      return [];
    }

    return list.map((l: any) => ({
      id: l.id,
      serialNumber: l.serialNumber,
      domain: l.domain,
      customerName: l.customerName,
      apps: (l.apps || []).map((a: any) => ({
        appType: a.appType || null,
        currentVersion: a.currentVersion || null,
        currentFileName: a.currentFileName || null
      }))
    }));
  }

  // toggle selection of customers
  toggleLicenseSelection(licenseId: number, event: any) {
    if (event.target.checked) {
      if (!this.selectedLicenseIds.includes(licenseId)) {
        this.selectedLicenseIds.push(licenseId);
      }
    } else {
      this.selectedLicenseIds = this.selectedLicenseIds.filter(id => id !== licenseId);
    }
  }

  onCustomerOptionChange(option: string) {
    this.customerOption = option;
    if (option === 'all') {
      this.selectedLicenseIds = []; // Clear selection when "all" is chosen
    }
  }

  submit() {
    this.markFormGroupTouched(this.form);
    if (this.form.invalid) {
      this.errorService.showError('Please fill in all required fields', 'error');
      return;
    }
    // when "Select Specific Customers" is chosen, require at least one customer selected
    if (this.customerOption === 'select' && this.selectedLicenseIds.length === 0) {
      this.errorService.showError('Please fill in all required customers fields', 'error');
      return;
    }
    // ensure filename parsing succeeded for all rows
    if (this.parseErrors.some(e => !!e)) {
      this.errorService.showError('Please fix filename parsing errors before submitting', 'error');
      return;
    }
    // Ensure hashes exist
    for (var i = 0; i < this.builds.length; i++) {
      if (!this.builds.at(i).value.file_hash) {
        this.errorService.showError('Please wait for file hashing to finish', 'error');
        return;
      }
    }

    // PRECHECK FIRST
    this.precheckUpload((ok, msg) => {
      if (!ok) {
        this.errorService.showError(msg || 'Upload rejected', 'error');
        return;
      }

      // ONLY NOW do actual upload
      this.performUpload();
    });
  }

  // submit final payload
  private performUpload() {

    const formData = new FormData();
    // append builds
    this.builds.controls.forEach((group, i) => {
      const val = group.value;

      formData.append(`builds[${i}][version]`, val.version);
      formData.append(`builds[${i}][start_date]`, val.start_date);
      formData.append(`builds[${i}][end_date]`, val.end_date);
      formData.append(`builds[${i}][app_type]`, val.app_type);
      formData.append(`builds[${i}][file_hash]`, val.file_hash);
      formData.append(`builds[${i}][file]`, val.file);
    });

    // append selected customers
    if (this.customerOption === 'all') {
      // Send all license IDs when "Send to All Customers" is selected
      this.licenses.forEach((license, i) => {
        formData.append(`licenseIds[${i}]`, String(license.id));
      });
    } else {
      // Send only selected license IDs when "Select Specific Customers" is selected
      this.selectedLicenseIds.forEach((id, i) => {
        formData.append(`licenseIds[${i}]`, String(id));
      });
    }

    // append uploaded by from localStorage
    const uploadedBy = sessionStorage.getItem('username');
    if (uploadedBy) {
      formData.append('uploadedBy', uploadedBy);
    }

    // Make the HTTP request with progress tracking
    this.http.post(apiUrl + '/api/send-builds', formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          // Calculate and update progress
          const progress = Math.round(100 * event.loaded / (event.total || 1));
          this.errorService.showError(`Uploading... ${progress}%`, 'info');
        } else if (event.type === HttpEventType.Response) {
          // Show success message
          this.errorService.showError('Builds uploaded successfully!', 'success');
          console.log("Upload success:", event.body);
          this.router.navigate(['/build-list']);
        }
      },
      error: (err) => {
        console.error("Upload failed:", err);
        const errorMessage = (err && err.error && err.error.message) ? err.error.message : 'Unknown error';
        this.errorService.showError(`Error uploading builds: ${errorMessage}`, 'error');
      }
    });
  }

  // helper method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.controls[key];
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control.markAsTouched();
      }
    });
  }

  navigateTo(url: string) {
    this.router.navigate([url]);
  }

  async onLogout() {
    const confirmed = await this.logoutService.showConfirmation();
    if (confirmed) {
      console.log('logout click');
      sessionStorage.removeItem('adminId');
      sessionStorage.removeItem('username');
      this.router.navigate(['/login']);
    }
  }

  /**
   * Try to parse filename to determine app type and version.
  */
  private parseFileName(fileName: string): { appType: string, version: string } | null {
    const name = fileName.replace(/\.[^/.]+$/, ''); // strip extension

    // Strict anchored patterns: prefix + '_' + version (digits with optional dots) and end anchored
    let m = /^V_(\d+(?:\.\d+)*)$/i.exec(name);
    if (m) return { appType: 'NexxRetail', version: m[1] };

    m = /^NexxLicense_(\d+(?:\.\d+)*)$/i.exec(name);
    if (m) return { appType: 'NexxLicense', version: m[1] };

    m = /^NL_(\d+(?:\.\d+)*)$/i.exec(name);
    if (m) return { appType: 'Pos', version: m[1] };

    m = /^NM_(\d+(?:\.\d+)*)$/i.exec(name);
    if (m) return { appType: 'Massenger', version: m[1] };

    // strict matching only; do not attempt loose fallbacks
    return null;
  }

  private async hashFile(file: File): Promise<string> {
    const hasher = await createSHA256();
    const chunkSize = 4 * 1024 * 1024; // 4MB
    var offset = 0;

    while (offset < file.size) {
      const slice = file.slice(offset, offset + chunkSize);
      const buffer = await (slice as any).arrayBuffer();
      hasher.update(new Uint8Array(buffer));
      offset += chunkSize;
    }

    return hasher.digest('hex');
  }

  private precheckUpload(callback: (ok: boolean, msg?: string) => void): void {
    var payload = {
      builds: this.builds.controls.map(b => ({
        version: b.value.version,
        appType: b.value.app_type,
        fileHash: b.value.file_hash
      })),
      licenseIds:
        this.customerOption === 'all'
          ? this.licenses.map(l => l.id)
          : this.selectedLicenseIds
    };

    this.http.post(apiUrl + '/api/precheck-builds', payload)
      .subscribe(
        (res: any) => {
          if (res && res.allowed) {
            callback(true);
          } else {
            callback(false, res.message || 'Precheck failed');
          }
        },
        () => callback(false, 'Precheck request failed')
      );
  }

  exportCSV() {
    if (this.downloadingCsv) return;
    this.downloadingCsv = true;

    // endpoint: http://localhost:9090/NexxLicense/licenses/license-version?format=csv
    const url = apiUrl + '/licenses/license-version';

    this.http.get(url, { params: { format: 'csv' }, responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        const filename = 'license_versions.csv';
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(objectUrl);

        this.errorService.showError('CSV downloaded', 'success');
        this.downloadingCsv = false;
      },
      error: (err) => {
        console.error('CSV download failed', err);
        this.errorService.showError('Failed to download CSV', 'error');
        this.downloadingCsv = false;
      }
    });
  }

}
