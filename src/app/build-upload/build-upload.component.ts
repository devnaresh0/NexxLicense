import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { LicenseService } from '../services/license.service';
import { apiUrl } from 'src/environments/global';
import { HttpClient } from '@angular/common/http';
export interface License {
  id: string;
  serialNumber: number;
  domain: string;
  customerName: string;
  active: boolean;
}

@Component({
  selector: 'app-build-upload',
  templateUrl: './build-upload.component.html'
}
)
export class BuildUploadComponent implements OnInit {

  form: FormGroup;

  // license data
  licenses: License[] = [];
  selectedLicenseIds: number[] = [];
  loadingLicenses = false;

  constructor(
    private fb: FormBuilder,
    private licenseService: LicenseService,
    private http: HttpClient
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
  toggleLicenseSelection(licenseId: number, event: any) {
    if (event.target.checked) {
      this.selectedLicenseIds.push(licenseId);
    } else {
      this.selectedLicenseIds = this.selectedLicenseIds.filter(id => id !== licenseId);
    }
  }

  // submit final payload
  submit() {
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
    this.selectedLicenseIds.forEach((id, i) => {
      formData.append(`licenseIds[${i}]`, String(id));
    });

    // append uploaded by from localStorage
    const uploadedBy = localStorage.getItem('username');
    if (uploadedBy) {
      formData.append('uploadedBy', uploadedBy);
    }

    this.http.post(apiUrl + '/api/send-builds', formData).subscribe({
      next: (res) => {
        console.log("Upload success:", res);
        alert("Builds uploaded successfully!");
      },
      error: (err) => {
        console.error("Upload failed:", err);
        alert("Error uploading builds");
      }
    });
  }
}
