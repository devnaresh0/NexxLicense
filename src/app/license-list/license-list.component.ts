// license-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LicenseService } from '../services/license.service';
import { filter } from 'rxjs/operators';

export interface License {
  id: string;
  tenantId: string;
  domain: string;
  customer: string;
  status: string;
}

@Component({
  selector: 'app-license-list',
  templateUrl: './license-list.component.html',
  styleUrls: ['./license-list.component.css']
})

export class LicenseListComponent implements OnInit {

  licenses: License[] = [];

  filteredLicenses: License[] = [];
  searchTerm: string = '';
  selectedFilter: string = 'All';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  sortBy: string = 'text-input';

  constructor(
    private router: Router,
    private licenseService: LicenseService
  ) {

  }

  ngOnInit() {
    this.loadLicenses();
  }
  // call to api for licenses
  loadLicenses() {
    this.licenseService.getLicenses().subscribe(
      data => {
        this.licenses = data;
        this.filteredLicenses = [...this.licenses];
        this.calculateTotalPages();
        console.log(this.licenses,"licenses 1st Page")
      },
      error => {
        console.error('Error loading licenses:', error);
      }
    );
  }
  // Filter 
  onFilterChange(filter: string) {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  //search via input 
  onSearch() {
    this.applyFilters();
  }

  // Filter the license based on status and search term
  private applyFilters() {
    let filtered = [...this.licenses];
    // Apply status filter
    if (this.selectedFilter !== 'All') {
      filtered = filtered.filter(license =>
        license.status.toLowerCase() === this.selectedFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(license =>
        license.domain.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        license.customer.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Apply sorting (always ascending)
    filtered = this.sortLicenses(filtered, this.sortBy, 'asc');

    this.filteredLicenses = filtered;
    this.calculateTotalPages();
    this.currentPage = 1;
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
    this.sortBy = sortBy;
    this.applyFilters();
  }

  //Sort licenses based on selected field
  private sortLicenses(licenses: License[], sortBy: string, direction: 'asc'): License[] {
    if (sortBy === 'text-input') {
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