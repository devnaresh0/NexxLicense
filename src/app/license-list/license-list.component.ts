// license-list.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LicenseService } from '../services/license.service';
import { LogoutService } from '../services/logout.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { LicenseState } from '../state/license.state';

export interface License {
  id: string;
  serialNumber: number;
  domain: string;
  customerName: string;
  active: boolean;
}

@Component({
  selector: 'app-license-list',
  templateUrl: './license-list.component.html',
  styleUrls: ['./license-list.component.css']
})

export class LicenseListComponent implements OnInit, OnDestroy {
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

  constructor(
    private router: Router,
    private licenseService: LicenseService,
    private licenseState: LicenseState,
    private logoutService: LogoutService
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

    // Add ellipsis if needed after first page
    // if (startPage > 2) {
    //   pages.push('...');
    // }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < this.totalPages) {
        pages.push(i);
      }
    }

    // Add ellipsis before last page if needed
    // if (endPage < this.totalPages - 1) {
    //   pages.push('...');
    // }

    // Always show last page if there is more than one page
    if (this.totalPages > 1) {
      pages.push(this.totalPages);
    }

    return pages;
  }
}