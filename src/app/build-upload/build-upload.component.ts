import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { LicenseService } from '../services/license.service';
import { apiUrl } from 'src/environments/global';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { Router } from '@angular/router';
import { LogoutService } from '../services/logout.service';
import { ErrorService } from "../services/error.service";

export interface License {
  id: string;
  serialNumber: number;
  domain: string;
  customerName: string;
  active: boolean;
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
  selectedLicenseIds: number[] = [];
  loadingLicenses = false;
  customerOption: string = 'all'; // 'all' or 'select'

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
      file: [null, Validators.required]
    });
  }

  // add file block
  addBuild() {
    this.builds.push(this.buildGroup());
  }

  // remove file block
  removeBuild(i: number) {
    this.builds.removeAt(i);
  }

  // file change
  onFileChange(event: any, index: number) {
    const file = event.target.files[0];
    this.builds.at(index).patchValue({ file });
  }

  // fetch customers/licenses
  fetchLicenses() {
    this.loadingLicenses = true;

    this.licenseService.getLicenses().subscribe({
      next: (data) => {
        this.licenses = data;
        this.loadingLicenses = false;
      },
      error: () => {
        this.loadingLicenses = false;
      }
    });
  }

  // toggle selection of customers
  toggleLicenseSelection(licenseId: string, event: any) {
    if (event.target.checked) {
      this.selectedLicenseIds.push(Number(licenseId));
    } else {
      this.selectedLicenseIds = this.selectedLicenseIds.filter(id => id !== Number(licenseId));
    }
  }

  onCustomerOptionChange(option: string) {
    this.customerOption = option;
    if (option === 'all') {
      this.selectedLicenseIds = []; // Clear selection when "all" is chosen
    }
  }

  // submit final payload
  submit() {
    // Mark all form controls as touched to trigger validation messages
    this.markFormGroupTouched(this.form);

    // Check if form is invalid
    if (this.form.invalid) {
      this.errorService.showError('Please fill in all required fields', 'error');
      return;
    }

    // Validate customer selection
    if (this.customerOption === 'select' && this.selectedLicenseIds.length === 0) {
      this.errorService.showError('Please select at least one customer', 'error');
      return;
    }

    // Validate dates
    const invalidDates = this.builds.controls.some(group => {
      const startDateControl = group.get('start_date');
      const endDateControl = group.get('end_date');
      const startDate = startDateControl ? new Date(startDateControl.value) : null;
      const endDate = endDateControl ? new Date(endDateControl.value) : null;
      return endDate < startDate;
    });

    if (invalidDates) {
      this.errorService.showError('End date cannot be before start date', 'error');
      return;
    }

    const formData = new FormData();

    // append builds
    this.builds.controls.forEach((group, i) => {
      const val = group.value;

      formData.append(`builds[${i}][version]`, val.version);
      formData.append(`builds[${i}][start_date]`, val.start_date);
      formData.append(`builds[${i}][end_date]`, val.end_date);
      formData.append(`builds[${i}][app_type]`, val.app_type);
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
    const uploadedBy = localStorage.getItem('username');
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
          this.errorService.showError(`Uploading... ${progress}% complete`, 'info');
          this.router.navigate(['/build-list']);
        } else if (event.type === HttpEventType.Response) {
          // Show success message
          this.errorService.showError('Builds uploaded successfully!', 'success');
          console.log("Upload success:", event.body);
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
      localStorage.removeItem('adminId');
      localStorage.removeItem('username');
      this.router.navigate(['/login']);
    }
  }
}
