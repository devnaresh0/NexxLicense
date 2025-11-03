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
import {apiUrl} from '../../environments/global';
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
  viewLicense(license: License) {
    this.router.navigate(['/license', license.id, 'view']);
  }

  //Create new license
  createNewLicense() {
    this.router.navigate(['/license/new']);
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
    const wrapper = document.createElement('div');
    wrapper.className = 'upload-field';

    // Create type select
    const select = document.createElement('select');
    select.className = 'upload-type';
    select.innerHTML = [
      '<option value="">Select Type</option>',
      '<option value="frontend">Frontend</option>',
      '<option value="backend">Backend</option>',
      '<option value="mobile">Mobile</option>'
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

    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'btn-remove';
    removeBtn.onclick = function() {
      if (wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
    };

    // Append all elements
    wrapper.appendChild(select);
    wrapper.appendChild(versionInput);
    wrapper.appendChild(endDateInput);
    wrapper.appendChild(fileInput);
    wrapper.appendChild(removeBtn);
    container.appendChild(wrapper);
  }

 private async handleUpload() {
  const uploads = document.querySelectorAll('.upload-field');
  const uploadsArray = Array.prototype.slice.call(uploads);

  // Prepare FormData (single request)
  const formData = new FormData();

  uploadsArray.forEach((field: Element, index: number) => {
    const select = field.querySelector('select.upload-type') as HTMLSelectElement;
    const versionInput = field.querySelector('input.upload-version') as HTMLInputElement;
    const endDateInput = field.querySelector('input.upload-end-date') as HTMLInputElement;
    const fileInput = field.querySelector('input[type="file"]') as HTMLInputElement;

    if (!select || !versionInput || !endDateInput || !(fileInput && fileInput.files && fileInput.files[0])) {
      return; // skip if any field missing
    }

    const file = fileInput.files[0];
    const version = versionInput.value;
    const endDate = endDateInput.value;
    const fileType = select.value; // maps to 'fileType' in backend
    const licenseIds = Array.from(this.selectedLicenses); // assume one or more selected licenses

    // Append one entry per file (you can choose to send one by one instead)
    formData.append('file', file, file.name);
    formData.append('version', version);
    formData.append('licenseId', licenseIds.length > 0 ? licenseIds[0] : ''); // pick first license if multiple
    formData.append('fileType', fileType);
    formData.append('endDate', endDate);
  });

  console.log('FormData prepared for backend:');
  for (const pair of (formData as any).entries()) {
    console.log(pair[0], ':', pair[1]);
  }

  try {
    const response = await this.http.post(
      `${apiUrl}/upload`,
      formData,
      {
        headers: new HttpHeaders({
          // 'Content-Type' is automatically set for FormData
        }),
        reportProgress: true,
        observe: 'response'
      }
    ).toPromise();

    console.log('Upload successful', response);
    alert('Files uploaded successfully!');
    this.isUploadMode = false;

    const uploadContainer = document.querySelector('.upload-container');
    if (uploadContainer) uploadContainer.innerHTML = '';

  } catch (error) {
    console.error('Upload failed:', error);
    const errorMessage = error && error.error && error.error.message 
      ? error.error.message 
      : '';
    alert('Upload failed. Please try again. ' + errorMessage);
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