// license-detail.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { Subject, throwError } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { ActivatedRoute, Router } from "@angular/router";
import { LicenseService, ModuleResponse } from "../services/license.service";
import { LogoutService } from "../services/logout.service";
import { from } from "rxjs";
import { ErrorService } from "../services/error.service";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { apiUrl } from "src/environments/global";

export interface LicenseModule {
  id: number;
  module: string;
  numberOfUsers: number;
  startDate: string;
  endDate: string;
}

export interface LicenseHeader {
  id?: number;
  serialNumber: number | null | string;
  domain: string;
  customerName: string;
  active: boolean;
}

@Component({
  selector: "app-build-manage",
  templateUrl: "./build-manage.component.html",
  styleUrls: ["./build-manage.component.css"]
})

export class BuildManageComponent implements OnInit, OnDestroy {
  isUploadMode = false; // Track if upload mode is active

  licenseId: string;
  isEditMode: boolean = false;
  isNewLicense: boolean = false;
  licenseModules: LicenseModule[] = [];
  prevHeader: LicenseHeader;
  prevModules: LicenseModule[];
  originalLicenseData: any;
  availableModules: ModuleResponse[] = [];
  isSaving: boolean = false;

  private destroy$ = new Subject<void>();

  licenseHeader: LicenseHeader = {
    serialNumber: null,
    domain: "",
    customerName: "",
    active: true,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private licenseService: LicenseService,
    private errorService: ErrorService,
    private cdr: ChangeDetectorRef,
    private logoutService: LogoutService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params["id"] === "new") {
          this.isNewLicense = true;
          this.isEditMode = true;
          this.initializeNewLicense();
        } else {
          this.licenseId = params["id"];
          this.isEditMode =
            this.route.snapshot.routeConfig &&
              this.route.snapshot.routeConfig.path &&
              (this.route.snapshot.routeConfig.path.endsWith("edit") || this.route.snapshot.routeConfig.path.endsWith("manage"))
              ? true
              : false;
        }
      });
  }

  initializeNewLicense() {
    this.licenseHeader = {
      serialNumber: null,
      domain: "",
      customerName: "",
      active: true,
    };
    this.loadModules();
    this.licenseModules = [];
  }

  trackByModuleId(index: number, module: LicenseModule): number {
    return module.id;
  }

  loadModules() {
    this.licenseService.getModules()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          this.availableModules = data;
        },
        (error) => {
          console.error("Error loading modules:", error);
        }
      );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLicense() {
    // First ensure modules are loaded
    this.licenseService.getModules()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((modules: ModuleResponse[]) => {
          this.availableModules = modules;
          // Now load the license details
          return this.licenseService.getLicenseDetails(this.licenseId);
        })
      )
      .subscribe({
        next: (data: any) => {
          console.log('License data loaded:', data);
          this.licenseHeader = { ...data.header };

          // Map the modules to ensure we have the correct module names
          this.licenseModules = (data.modules || []).map((module: any) => {
            // Find the full module details from availableModules
            const moduleDetails = this.availableModules.find(m =>
              (m as any).id === module.moduleId || m.moduleName === module.module
            );

            return {
              ...module,
              module: (moduleDetails && moduleDetails.moduleName) || module.module || '',
              // Ensure all required fields are present
              id: module.id || Math.floor(Math.random() * 10000),
              numberOfUsers: module.numberOfUsers || 1,
              startDate: module.startDate || this.formatDate(new Date()),
              endDate: module.endDate || this.formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
            };
          });

          this.originalLicenseData = JSON.parse(JSON.stringify(data));
          this.prevHeader = { ...this.licenseHeader };
          this.prevModules = this.licenseModules.map(m => ({ ...m }));

          // Force change detection to update the view
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading license:', error);
          this.errorService.showError('Failed to load license details', 'error');
        }
      });
  }

  navigateToBuilds() {
    this.router.navigate(["/builds"]);
  }

  onAudit() {
    if (this.licenseHeader && this.licenseHeader.domain) {
      this.router.navigate(['/audit', this.licenseHeader.domain]);
    } else {
      console.error('No domain available for audit navigation');
    }
  }

  onReset() {
    if (this.isNewLicense) {
      this.initializeNewLicense();
    } else if (this.originalLicenseData) {
      this.licenseHeader = { ...this.prevHeader };

      this.licenseModules = this.prevModules.map((m) => ({ ...m }))
    }
  }

  onSave() {
    // Convert empty string to null for serialNumber
    const header = {
      ...this.licenseHeader,
      serialNumber: this.licenseHeader.serialNumber === '' ? null : this.licenseHeader.serialNumber
    };

    // Create a map of module names to their IDs for quick lookup
    const moduleNameToIdMap = new Map<string, number>();
    this.availableModules.forEach(module => {
      moduleNameToIdMap.set(module.moduleName, module.id);
    });

    // Map the license modules to include moduleId
    const modulesWithIds = this.licenseModules.map(module => {
      const moduleId = moduleNameToIdMap.get(module.module) || 0;
      return {
        ...module,
        moduleId: moduleId,
        moduleName: module.module
      };
    });

    // Create the base license data
    const baseLicenseData = {
      header: {
        ...header,
        id: this.licenseId,
      },
      modules: modulesWithIds,
    };

    // Get adminId from localStorage or use a default value
    const adminId = parseInt(localStorage.getItem('adminId') || '1', 10);

    // Create the final payload with additional fields
    const licenseData = {
      adminId: adminId,
      id: this.licenseId ? parseInt(this.licenseId, 10) : null,
      oldData: null,
      newData: JSON.stringify({
        ...baseLicenseData.header,
        modules: baseLicenseData.modules
      }),
      ...baseLicenseData // Keep the original structure for backward compatibility
    };

    const validation = this.licenseService.validateLicense(licenseData);
    console.log(JSON.stringify(licenseData));
    if (!validation.isValid) {
      // Show validation errors in a popup
      const errorMessage = validation.errors.join('\n');
      this.errorService.showError(errorMessage, 'error');
      return;
    }

    console.log('Saving license data:', licenseData);

    this.licenseService.saveLicense(licenseData).subscribe({
      next: (response) => {
        const message = response.message || 'License saved successfully';
        this.router.navigate(['/licenses']);
      },
      error: (error) => {
        console.error("Error saving license:", error);
      }
    });
  }

  addModule() {
    const newId = Math.max(...this.licenseModules.map((m) => +m.id), 0) + 1;
    const newModule: LicenseModule = {
      id: newId,
      module: "",
      numberOfUsers: 1,
      startDate: this.formatDate(new Date()),
      endDate: this.formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
    };
    this.licenseModules.push(newModule);
  }

  removeModule(moduleId: number) {
    if (this.licenseModules.length > 0) {
      this.licenseModules = this.licenseModules.filter(
        (m) => m.id !== moduleId
      );
    }
  }

  onModuleChange(moduleId: number, field: string, value: any) {
    const moduleIndex = this.licenseModules.findIndex(m => m.id === moduleId);
    if (moduleIndex > -1) {
      this.licenseModules[moduleIndex] = {
        ...this.licenseModules[moduleIndex],
        [field]: value
      };
    }
  }

  onDateChange(moduleId: number, field: 'startDate' | 'endDate', dateString: string) {
    // Convert the date string to ISO format
    const date = dateString ? new Date(dateString).toISOString() : '';
    this.onModuleChange(moduleId, field, date);
  }

  onHeaderFieldChange(field: string, value: any) {
    if (this.licenseHeader) {
      (this.licenseHeader as any)[field] = value;
    }
  }

  private formatDate(date: Date): string {
    const formatted = date.toISOString().split('T')[0];
    console.log(formatted)
    return formatted;
  }

  toggleActiveStatus() {
    this.licenseHeader.active = !this.licenseHeader.active;
  }

  // Toggle upload mode
  toggleUploadMode() {
    this.isUploadMode = !this.isUploadMode;
    if (this.isUploadMode) {
      // Use setTimeout to ensure the view is updated before initializing the uploader
      setTimeout(() => {
        this.initializeUploader();
      });
    } else {
      const container = document.getElementById('upload-container');
      if (container) {
        container.innerHTML = '';
      }
    }
  }

  // Initialize the uploader
  private initializeUploader() {
    // This will be called after the view is initialized
    setTimeout(() => {
      const uploadContainer = document.getElementById('upload-container');
      const submitBtn = document.getElementById('submit-upload');

      if (!uploadContainer || !submitBtn) return;

      // Clear any existing upload fields
      uploadContainer.innerHTML = '';

      // Add the first upload field
      this.addUploadField(uploadContainer);

      // Add event listener for submit
      submitBtn.addEventListener('click', () => this.handleUpload());
    });
  }

  // Add a new upload field
  private addUploadField(container: HTMLElement) {
    // Add compact styles
    if (!document.getElementById('upload-field-styles')) {
      const style = document.createElement('style');
      style.id = 'upload-field-styles';
      style.textContent = `
        .upload-field { margin: 2px 0; }
        .upload-field select,
        .upload-field input[type="text"],
        .upload-field input[type="date"],
        .upload-field input[type="file"] {
          width: 100%;
          padding: 0.2rem 0.3rem;
          font-size: 12px;
          border: 1px solid #ddd;
          border-radius: 2px;
          line-height: 1.2;
        }
      `;
      document.head.appendChild(style);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'upload-field';

    // Create type select
    const select = document.createElement('select');
    select.className = 'upload-type';
    select.innerHTML = [
      '<option value="">Select Type</option>',
      '<option value="NexxLicense">NexxLicense</option>',
      '<option value="NexxRetail">NexxRetail</option>'
    ].join('');

    // Create version input
    const versionInput = document.createElement('input');
    versionInput.type = 'text';
    versionInput.className = 'upload-version';
    versionInput.placeholder = 'Version (e.g., 1.0.0)';
    versionInput.required = true;

    // Create end date input
    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.className = 'upload-end-date';
    endDateInput.required = true;

    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.className = 'upload-file';
    fileInput.accept = '.zip,.tar,.gz,.rar';

    const createLabel = (text: string, forId: string) => {
      const label = document.createElement('label');
      label.textContent = text;
      label.setAttribute('for', forId);
      label.style.display = 'block';
      label.style.fontSize = '10px';
      label.style.marginBottom = '1px';
      label.style.color = '#666';
      return label;
    };

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.innerHTML = '×';
    removeBtn.title = 'Remove';
    removeBtn.style.background = '#ff6b6b';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '2px';
    removeBtn.style.width = '18px';
    removeBtn.style.height = '18px';
    removeBtn.style.display = 'inline-flex';
    removeBtn.style.alignItems = 'center';
    removeBtn.style.justifyContent = 'center';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.padding = '0';
    removeBtn.style.lineHeight = '1';
    removeBtn.style.marginBottom = '16px';
    removeBtn.onclick = function () {
      if (wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
    };

    const inputGroup = document.createElement('div');
    inputGroup.style.display = 'grid';
    inputGroup.style.gridTemplateColumns = '1fr 1fr 1fr';
    inputGroup.style.gap = '4px';
    inputGroup.style.padding = '6px';
    inputGroup.style.border = '1px solid #e0e0e0';
    inputGroup.style.borderRadius = '3px';
    inputGroup.style.backgroundColor = '#f5f5f5';

    const field1 = document.createElement('div');
    const field2 = document.createElement('div');
    const field3 = document.createElement('div');
    const field4 = document.createElement('div');
    field4.style.gridColumn = '1 / -1';

    // Create container for end date and remove button
    const endDateContainer = document.createElement('div');
    endDateContainer.style.display = 'flex';
    endDateContainer.style.gap = '4px';
    endDateContainer.style.alignItems = 'flex-end';

    const endDateWrapper = document.createElement('div');
    endDateWrapper.style.flex = '1';

    // Add elements to field containers
    field1.appendChild(createLabel('Build Type', 'build-type-' + Date.now()));
    field1.appendChild(select);
    field2.appendChild(createLabel('Version', 'version-' + Date.now()));
    field2.appendChild(versionInput);

    // Add end date and remove button to container
    endDateWrapper.appendChild(createLabel('End Date', 'end-date-' + Date.now()));
    endDateWrapper.appendChild(endDateInput);
    endDateContainer.appendChild(endDateWrapper);
    endDateContainer.appendChild(removeBtn);
    field3.appendChild(endDateContainer);

    field4.appendChild(createLabel('Build File', 'file-' + Date.now()));
    field4.appendChild(fileInput);

    // Add fields to input group
    inputGroup.appendChild(field1);
    inputGroup.appendChild(field2);
    inputGroup.appendChild(field3);
    inputGroup.appendChild(field4);

    wrapper.appendChild(inputGroup);
    container.appendChild(wrapper);
  }

  private async handleUpload() {
    try {
      console.group('=== Starting File Upload ===');

      const uploads = document.querySelectorAll('.upload-field');
      const uploadsArray = Array.from(uploads);
      const formData = new FormData();
      const uploadData: any[] = [];
      let fileCount = 0;

      // Process each upload field
      uploadsArray.forEach((field: Element, index: number) => {
        const select = field.querySelector('select') as HTMLSelectElement;
        const versionInput = field.querySelector('input[type="text"]') as HTMLInputElement;
        const endDateInput = field.querySelector('input[type="date"]') as HTMLInputElement;
        const fileInput = field.querySelector('input[type="file"]') as HTMLInputElement;

        // Skip if any required field is missing
        if (!select || !versionInput || !endDateInput || !fileInput || !fileInput.files || fileInput.files.length === 0) {
          console.warn(`Skipping incomplete upload field at index ${index}`);
          return;
        }

        const file = fileInput.files[0];
        const version = versionInput.value;
        const endDate = endDateInput.value;
        const fileType = select.value;
        const licenseId = this.licenseId && this.licenseId !== 'new' ? this.licenseId : 'None selected';

        // Add to FormData with array-like syntax for multiple files
        formData.append(`files[${fileCount}]`, file, file.name);
        formData.append(`versions[${fileCount}]`, version);
        formData.append(`endDates[${fileCount}]`, endDate);
        formData.append(`types[${fileCount}]`, fileType);
        fileCount++;

        // Add to uploadData for logging
        uploadData.push({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          version,
          endDate,
          buildType: fileType,
          licenseId: licenseId
        });
      });

      // Add license ID only once if available
      if (this.licenseId && this.licenseId !== 'new') {
        formData.append('licenseId', this.licenseId);
      }

      console.log('Files to be uploaded:', uploadData);
      console.log('FormData entries:');
      for (const pair of (formData as any).entries()) {
        console.log(`${pair[0]}:`, pair[1]);
      }

      // Check if there are any files to upload
      if (uploadData.length === 0) {
        console.warn('No valid files selected for upload');
        alert('Please complete all required fields for at least one file.');
        return;
      }

      console.log('FormData entries:');
      for (const pair of (formData as any).entries()) {
        console.log(`${pair[0]}:`, pair[1]);
      }

      // Send the FormData with proper headers
      const response = await this.http.post(
        `${apiUrl}/api/builds/upload`,
        formData,
        {
          // Let the browser set the Content-Type with boundary
          headers: new HttpHeaders({
            'Accept': 'application/json'
          }),
          observe: 'response'
        }
      ).toPromise();

      console.group('Upload Successful');
      console.log('Server Response:', response);
      console.groupEnd();

      alert('Files uploaded successfully!');

      // Reset the upload form
      this.isUploadMode = false;
      const uploadContainer = document.getElementById('upload-container');
      if (uploadContainer) {
        uploadContainer.innerHTML = '';
      }

      console.groupEnd(); // End the main group

    } catch (error) {
      console.group('Upload Failed');
      console.error('Error details:', error);

      let errorMessage = 'Upload Successfull';
      if (error && error.error) {
        if (typeof error.error === 'string') {
          try {
            const errorObj = JSON.parse(error.error);
            errorMessage = errorObj.message || errorMessage;
          } catch (e) {
            errorMessage = error.error;
          }
        } else if (error.error.message) {
          errorMessage = error.error.message;
        }
      }

      console.error('Error message to user:', errorMessage);
      console.groupEnd();

      alert(errorMessage);
    }
  }

  isFormValid(): boolean {
    // Check if the data from api is fetched or not
    // Check header fields
    const isHeaderValid =
      this.licenseHeader.domain.trim() !== "" &&
      this.licenseHeader.customerName.trim() !== "";
    // Check if any module is invalid (empty name or invalid user count)
    const hasInvalidModule = this.licenseModules.some(
      (module) =>
        !module.module ||
        module.module.trim() === "" ||
        module.module === "Select Module" ||
        module.numberOfUsers <= 0
    );

    // Check if any modules exist
    const hasModules = this.licenseModules.length > -1;

    // For edit mode, check if anything changed
    if (this.isEditMode && !this.isNewLicense) {
      if (this.prevHeader === undefined) {
        return false;
      }
      // Check header changes including active status
      const headerChanged =
        this.licenseHeader.serialNumber !== this.prevHeader.serialNumber ||
        this.licenseHeader.domain.trim() !== this.prevHeader.domain.trim() ||
        this.licenseHeader.customerName.trim() !== this.prevHeader.customerName.trim() ||
        this.licenseHeader.active !== this.prevHeader.active;

      // Check if modules have changed by comparing their stringify version
      const currentModules = JSON.stringify(
        this.licenseModules.map((m) => ({
          module: m.module,
          numberOfUsers: m.numberOfUsers,
          startDate: m.startDate,
          endDate: m.endDate,
        }))
      );

      const previousModules = JSON.stringify(
        this.prevModules.map((m) => ({
          module: m.module,
          numberOfUsers: m.numberOfUsers,
          startDate: m.startDate,
          endDate: m.endDate,
        }))
      );
      const modulesChanged = currentModules !== previousModules;

      // Return true if either header or modules changed and form is valid
      return (
        (headerChanged || modulesChanged) &&
        isHeaderValid &&
        !hasInvalidModule &&
        hasModules
      );
    }
    // For new license, just check basic validation
    return isHeaderValid && !hasInvalidModule && hasModules;
  }

  canEdit(): boolean {
    return this.isEditMode || this.isNewLicense;
  }

  /**
   * Compares modules for the select element
   */
  compareModules(module1: any, module2: any): boolean {
    return module1 && module2 ? module1 === module2 : module1 === module2;
  }

  // Logout method
  async onLogout() {
    const confirmed = await this.logoutService.showConfirmation();
    if (confirmed) {
      localStorage.removeItem('adminId');
      localStorage.removeItem('username');
      this.router.navigate(['/login']);
    }
  }
  newBuild(){
    this.router.navigate(['/builds']);
  }
}
