// license-list.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
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

export class BuildListComponent implements OnInit, OnDestroy {
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

  // Toggle upload mode
  toggleUploadMode() {
    this.isUploadMode = !this.isUploadMode;
    if (this.isUploadMode) {
      this.initializeUploader();
    } else {
      this.selectedLicenses.clear();
    }
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
      '<option value="NexxLicense-frontend">NexxLicense-Frontend</option>',
      '<option value="NexxLicense-backend">NexxLicense-Backend</option>',
      '<option value="NexxRetail-frontend">NexxRetail-Frontend</option>',
      '<option value="NexxRetail-backend">NexxRetail-Backend</option>'
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
    removeBtn.style.marginBottom = '16px'; // Align with end date input
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
      const licenseIds = Array.from(this.selectedLicenses);

      console.log('Selected License IDs:', licenseIds);
      
      // Process each upload field
      uploadsArray.forEach((field: Element, index: number) => {
        const select = field.querySelector('select.upload-type') as HTMLSelectElement;
        const versionInput = field.querySelector('input.upload-version') as HTMLInputElement;
        const endDateInput = field.querySelector('input.upload-end-date') as HTMLInputElement;
        const fileInput = field.querySelector('input[type="file"]') as HTMLInputElement;
        
        // Skip if any required field is missing
        if (!select || !versionInput || !endDateInput || !(fileInput && fileInput.files && fileInput.files[0])) {
          console.warn(`Skipping incomplete upload field at index ${index}`);
          return;
        }
        
        const file = fileInput.files[0];
        const version = versionInput.value;
        const endDate = endDateInput.value;
        const fileType = select.value;
        
        // Prepare data for logging
        const fileInfo = {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          version,
          endDate,
          buildType: fileType,
          licenseId: licenseIds[0] || 'None selected'
        };
        
        uploadData.push(fileInfo);
        
        // Add to FormData for the actual upload
        formData.append('files', file);
        formData.append('versions', version);
        formData.append('endDates', endDate);
        formData.append('types', fileType);
        if (licenseIds[0]) {
          formData.append('licenseId', licenseIds[0]);
        }
      });
      
      // Log the collected data
      console.log('Files to be uploaded:', uploadData);
      console.log('FormData entries:');
      for (const pair of (formData as any).entries()) {
        if (pair[0] === 'files') {
          console.log(`${pair[0]}: ${pair[1].name} (${pair[1].size} bytes, ${pair[1].type})`);
        } else {
          console.log(`${pair[0]}: ${pair[1]}`);
        }
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
      
      let errorMessage = 'Upload successfull.';
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
}