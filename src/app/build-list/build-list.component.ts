// license-list.component.ts
import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LicenseService } from '../services/license.service';
import { LogoutService } from '../services/logout.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LicenseState } from '../state/license.state';
import { environment } from '../../environments/environment';
import { apiUrl } from '../../environments/global';
export interface License {
  id: string;
  serialNumber: number;
  domain: string;
  customerName: string;
  active: boolean;
}

@Component({
  selector: 'app-build-list',
  templateUrl: './build-list.component.html',
  styleUrls: ['./build-list.component.css']
})

export class BuildListComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();

  licenses: License[] = [];
  filteredLicenses: License[] = [];

  // State properties with default values
  searchTerm: string = '';
  selectedFilter: string = 'All';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  sortOrder: 'asc' = 'asc';
  sortBy: string = 'search';
  isUploadMode = false; // Tracks if upload mode is active
  selectedLicenses = new Set<string>(); // Tracks selected license IDs

  constructor(
    private router: Router,
    private licenseService: LicenseService,
    private licenseState: LicenseState,
    private logoutService: LogoutService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    // Subscribe to state changes
    this.licenseState.getState$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.searchTerm = state.searchTerm;
        this.selectedFilter = state.selectedFilter;
        this.currentPage = state.currentPage;
        this.itemsPerPage = state.itemsPerPage;
        this.sortBy = state.sortBy;
        this.sortOrder = state.sortOrder;
      });

    this.loadLicenses();
  }

  ngAfterViewInit() {
    // Initialize uploader when component loads
    this.initializeUploader();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateState() {
    this.licenseState.updateState({
      searchTerm: this.searchTerm,
      selectedFilter: this.selectedFilter,
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    });
  }

  loadLicenses() {
    this.licenseService.getLicenses().subscribe(
      data => {
        this.licenses = data;
        this.applyFilters();
        this.calculateTotalPages();
      },
      error => {
        console.error('Error loading licenses:', error);
      }
    );
  }

  // Filter 
  onFilterChange(filter: string) {
    this.selectedFilter = filter;
    this.currentPage = 1; // Reset to first page when filter changes
    this.applyFilters();
    this.updateState();
  }

  //search via input 
  onSearch() {
    this.currentPage = 1; // Reset to first page when searching
    this.applyFilters();
    this.updateState();
  }

  // Filter the license based on status and search term
  private applyFilters() {
    if (!this.licenses || this.licenses.length === 0) return;

    let filtered = [...this.licenses];
    // Apply status filter
    if (this.selectedFilter !== 'All') {
      filtered = filtered.filter(license =>
        license.active === (this.selectedFilter === 'Active')
      );
    }

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(license =>
        license.domain.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        license.customerName.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Apply sorting with current sort order
    filtered = this.sortLicenses(filtered, this.sortBy, this.sortOrder);

    this.filteredLicenses = filtered;
    this.calculateTotalPages();

    // Ensure current page is within bounds
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.currentPage < 1 && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  //Calculate total pages for Pagination
  private calculateTotalPages() {
    this.totalPages = Math.ceil(this.filteredLicenses.length / this.itemsPerPage);
  }

  //Get paginated licenses for display
  getPaginatedLicenses(): License[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredLicenses.slice(startIndex, endIndex);
  }

  //Sort licenses based on selected field
  onSortChange(sortBy: string) {
    // Toggle sort order if clicking the same field, otherwise default to ascending
    if (this.sortBy === sortBy) {
      this.sortOrder = this.sortOrder;
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'asc';
    }
    this.applyFilters();
    this.updateState();
  }

  //Sort licenses based on selected field
  private sortLicenses(licenses: License[], sortBy: string, direction: 'asc'): License[] {
    if (sortBy === 'search') {
      return [...licenses];
    }
    return [...licenses].sort((a, b) => {
      let valueA = a[sortBy as keyof License];
      let valueB = b[sortBy as keyof License];

      // Convert to string for case-insensitive comparison
      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();

      if (strA < strB) {
        return direction === 'asc' ? -1 : 1;
      }
      if (strA > strB) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  //Go to specific page
  goToPage(page: number | string) {
    // Convert string to number if needed
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;

    if (pageNum >= 1 && pageNum <= this.totalPages && pageNum !== this.currentPage) {
      this.currentPage = pageNum;
      // Force change detection by creating a new array reference
      this.filteredLicenses = [...this.filteredLicenses];
      this.updateState();
    }
  }

  //Edit license
  editLicense(license: License) {
    this.router.navigate(['/license', license.id, 'edit']);
  }

  //View license
  manageLicense(license: License) {
    this.router.navigate(['/build', license.id, 'manage']);
  }

  // Toggle upload mode - keeping this for any existing references, but it won't affect visibility anymore
  toggleUploadMode() {
    // No longer toggles visibility, just clears selection if needed
    this.selectedLicenses.clear();
  }

  // Initialize the uploader
  private initializeUploader() {
    // This will be called after the view is initialized
    setTimeout(() => {
      const uploadContainer = document.getElementById('upload-container');
      const addFileBtn = document.getElementById('add-file');
      const submitBtn = document.getElementById('submit');

      if (!uploadContainer || !addFileBtn || !submitBtn) return;

      // Clear any existing upload fields
      uploadContainer.innerHTML = '';

      // Add the first upload field
      this.addUploadField(uploadContainer);

      // Add event listeners
      addFileBtn.addEventListener('click', () => this.addUploadField(uploadContainer));
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
        .upload-field { margin: 10px 0; }
        .upload-field select,
        .upload-field input[type="text"],
        .upload-field input[type="date"],
        .upload-field input[type="file"] {
          width: 100%;
          padding: 0.3rem 0.5rem;
          font-size: 13px;
          border: 1px solid #ddd;
          border-radius: 4px;
          line-height: 1.3;
          box-sizing: border-box;
        }
        .upload-field input[type="file"] {
          padding: 0.2rem 0.3rem;
          font-size: 12px;
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

    // Create start date input
    const startDateInput = document.createElement('input');
    startDateInput.type = 'date';
    startDateInput.className = 'upload-start-date';
    startDateInput.required = true;
    startDateInput.valueAsDate = new Date(); // Set default to today

    // Create end date input
    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.className = 'upload-end-date';
    endDateInput.required = true;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    endDateInput.valueAsDate = tomorrow; // Set default to tomorrow

    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.className = 'upload-file';
    fileInput.accept = '.zip,.tar,.gz,.rar';
    fileInput.style.display = 'block';
    fileInput.style.marginBottom = '4px';

    // Create span to show selected file name
    const fileNameSpan = document.createElement('span');
    fileNameSpan.style.display = 'block';
    fileNameSpan.style.fontSize = '11px';
    fileNameSpan.style.color = '#666';
    fileNameSpan.textContent = 'No file chosen';

    // Update file name when file is selected
    fileInput.addEventListener('change', function () {
      if (this.files && this.files.length > 0) {
        let fileName = this.files[0].name;
        // Truncate long file names
        if (fileName.length > 20) {
          const parts = fileName.split('.');
          const ext = parts.pop() || '';
          const name = parts.join('.');
          fileName = name.substring(0, 15) + '...' + ext;
        }
        fileNameSpan.textContent = fileName;
        fileNameSpan.style.color = '#2196F3';
      } else {
        fileNameSpan.textContent = 'No file chosen';
        fileNameSpan.style.color = '#666';
      }
    });

    // Create container for file input and file name
    const fileContainer = document.createElement('div');

    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.innerHTML = '×';
    removeBtn.title = 'Remove';
    removeBtn.style.background = '#ff6b6b';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.borderRadius = '4px';
    removeBtn.style.width = '24px';
    removeBtn.style.height = '24px';
    removeBtn.style.display = 'inline-flex';
    removeBtn.style.alignItems = 'center';
    removeBtn.style.justifyContent = 'center';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.padding = '0';
    removeBtn.style.lineHeight = '1';
    removeBtn.style.marginTop = '20px';
    removeBtn.style.flexShrink = '0';
    removeBtn.onclick = () => {
      if (wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
    };

    const createLabel = (text: string, forId: string) => {
      const label = document.createElement('label');
      label.textContent = text;
      label.setAttribute('for', forId);
      label.style.display = 'block';
      label.style.fontSize = '11px';
      label.style.marginBottom = '3px';
      label.style.color = '#555';
      label.style.fontWeight = '500';
      return label;
    };

    const inputGroup = document.createElement('div');
    inputGroup.style.display = 'flex';
    inputGroup.style.gap = '10px';
    inputGroup.style.alignItems = 'flex-start';
    inputGroup.style.padding = '10px';
    inputGroup.style.border = '1px solid #e0e0e0';
    inputGroup.style.borderRadius = '6px';
    inputGroup.style.backgroundColor = '#f9f9f9';

    // Create field containers with flex: 1 to take equal width
    const createField = () => {
      const field = document.createElement('div');
      field.style.flex = '1';
      field.style.minWidth = '0'; // Prevent overflow
      return field;
    };

    const field1 = createField();
    const field2 = createField();
    const field3 = createField();
    const field4 = createField();
    const field5 = createField();

    // Add elements to field containers
    field1.appendChild(createLabel('Build Type', 'build-type-' + Date.now()));
    field1.appendChild(select);

    field2.appendChild(createLabel('Version', 'version-' + Date.now()));
    field2.appendChild(versionInput);

    field3.appendChild(createLabel('Start Date', 'start-date-' + Date.now()));
    field3.appendChild(startDateInput);

    field4.appendChild(createLabel('End Date', 'end-date-' + Date.now()));
    field4.appendChild(endDateInput);

    field5.appendChild(createLabel('Build File', 'file-' + Date.now()));
    field5.appendChild(fileContainer);
    fileContainer.appendChild(fileInput);
    fileContainer.appendChild(fileNameSpan);

    // Add all fields to input group
    inputGroup.appendChild(field1);
    inputGroup.appendChild(field2);
    inputGroup.appendChild(field3);
    inputGroup.appendChild(field4);
    inputGroup.appendChild(field5);

    // Add remove button at the end
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.marginLeft = '4px';
    buttonContainer.appendChild(removeBtn);

    inputGroup.appendChild(buttonContainer);
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
      const licenseIds = Array.from(this.selectedLicenses);
      let fileCount = 0;

      console.log('Selected License IDs:', licenseIds);

      // Process each upload field
      uploadsArray.forEach((field: Element, index: number) => {
        const select = field.querySelector('select.upload-type') as HTMLSelectElement;
        const versionInput = field.querySelector('input.upload-version') as HTMLInputElement;
        const startDateInput = field.querySelector('input.upload-start-date') as HTMLInputElement;
        const endDateInput = field.querySelector('input.upload-end-date') as HTMLInputElement;
        const fileInput = field.querySelector('input[type="file"]') as HTMLInputElement;

        // Skip if any required field is missing
        if (!select || !versionInput || !startDateInput || !endDateInput || !fileInput || !fileInput.files || fileInput.files.length === 0) {
          console.warn(`Skipping incomplete upload field at index ${index}`);
          return;
        }

        const file = fileInput.files[0];
        const version = versionInput.value;
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const fileType = select.value;

        // Add to FormData with array-like syntax for multiple files
        formData.append('files', file, file.name);  // Changed from `files[${fileCount}]`
        formData.append('versions', version);       // Changed from `versions[${fileCount}]`
        formData.append('startDates', startDate);   // Changed from `startDates[${fileCount}]`
        formData.append('endDates', endDate);       // Changed from `endDates[${fileCount}]`
        formData.append('types', fileType);         // Changed from `types[${fileCount}]`
        fileCount++;

        // Add to uploadData for logging
        uploadData.push({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          version,
          startDate,
          endDate,
          buildType: fileType,
          licenseId: licenseIds[0] || 'None selected'
        });
      });

      // Add license ID only once if available
      if (licenseIds[0]) {
        formData.append('licenseId', licenseIds[0]);
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

      console.log('Sending upload request to:', `${apiUrl}/api/builds/upload`);

      // Make the API call
      const response = await this.http.post(
        `${apiUrl}/api/builds/upload`,
        formData,
        {
          // Let the browser set the Content-Type with boundary
          headers: new HttpHeaders({
            'Accept': 'application/json'
          }),
          reportProgress: true,
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

      // Reload the builds list to show the newly uploaded files
      this.loadLicenses();

      console.groupEnd(); // End the main group

    } catch (error) {
      console.group('Upload Failed');
      console.error('Error details:', error);

      let errorMessage = 'Upload failed. Please try again.';
      if (error && error.error) {
        if (typeof error.error === 'string') {
          try {
            const errorObj = JSON.parse(error.error);
            errorMessage = errorObj.message || errorMessage;
          } catch (e) {
            errorMessage = error.error;
          }
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      console.error('Error message to user:', errorMessage);
      console.groupEnd();

      alert(errorMessage);
    }
  }


  // Toggle license selection
  toggleLicenseSelection(licenseId: string, event: Event) {
    event.stopPropagation();
    if (this.selectedLicenses.has(licenseId)) {
      this.selectedLicenses.delete(licenseId);
    } else {
      this.selectedLicenses.add(licenseId);
    }
  }

  // Check if a license is selected
  isLicenseSelected(licenseId: string): boolean {
    return this.selectedLicenses.has(licenseId);
  }

  // Toggle select all licenses in current page
  toggleSelectAll(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const currentPageLicenses = this.getPaginatedLicenses();

    if (isChecked) {
      currentPageLicenses.forEach(license => {
        this.selectedLicenses.add(license.id);
      });
    } else {
      currentPageLicenses.forEach(license => {
        this.selectedLicenses.delete(license.id);
      });
    }
  }

  // Navigate to create new license page
  createNewLicense() {
    this.router.navigate(['/create-license']);
  }

  // Logout method
  async onLogout() {
    const confirmed = await this.logoutService.showConfirmation();
    if (confirmed) {
      console.log('logut click');
      localStorage.removeItem('adminId');
      localStorage.removeItem('username');
      this.router.navigate(['/login']);
    }
  }

  onDownload() {
    console.log('Download button clicked');
    this.licenseService.downloadBuild().subscribe({
      next: (response) => {
        console.log('Download started', response);
      },
      error: (error) => {
        console.error('Download failed:', error);
      }
    });
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];

    // Always show first page
    pages.push(1);

    if (this.totalPages <= 1) {
      return pages;
    }

    // Calculate the range of pages to show around current page
    let startPage = Math.max(2, this.currentPage - 1);
    let endPage = Math.min(this.totalPages - 1, this.currentPage + 1);

    // Adjust if we're near the start or end
    if (this.currentPage <= 3) {
      endPage = Math.min(4, this.totalPages - 1);
    } else if (this.currentPage >= this.totalPages - 2) {
      startPage = Math.max(this.totalPages - 3, 2);
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < this.totalPages) {
        pages.push(i);
      }
    }

    // Always show last page if there is more than one page
    if (this.totalPages > 1) {
      pages.push(this.totalPages);
    }

    return pages;
  }

  isSendSelected: boolean = false;
  onSendSelectedChange(event: any) {
    this.isSendSelected = event.target.checked;
  }

  navigateToBuilds() {
    this.router.navigate(['/build/manage']);
  }
}