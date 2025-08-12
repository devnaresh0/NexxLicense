// license-list.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LicenseService } from '../services/license.service';

export interface License {
  id: number;
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
  
  licenses: License[] = [
    { id: 1, domain: 'Compulynx', customer: 'Compulynx Limited', status: 'Active' },
    { id: 2, domain: 'Flemingo', customer: 'Kenya Airport Authority', status: 'Active' },
    { id: 3, domain: 'OTW', customer: 'Onn The way', status: 'Active' }
  ];

  filteredLicenses: License[] = [];
  searchTerm: string = '';
  selectedFilter: string = 'All';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  constructor(
    private router: Router,
    private licenseService: LicenseService
  ) { }

  ngOnInit() {
    this.loadLicenses();
  }

  loadLicenses() {
    this.licenseService.getLicenses().subscribe(
      data => {
        this.licenses = data;
        this.filteredLicenses = [...this.licenses];
        this.calculateTotalPages();
      },
      error => {
        console.error('Error loading licenses:', error);
      }
    );
  }

  onFilterChange(filter: string) {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  onSearch() {
    this.applyFilters();
  }

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

    this.filteredLicenses = filtered;
    this.calculateTotalPages();
    this.currentPage = 1;
  }

  private calculateTotalPages() {
    this.totalPages = Math.ceil(this.filteredLicenses.length / this.itemsPerPage);
  }

  getPaginatedLicenses(): License[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredLicenses.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  editLicense(license: License) {
    this.router.navigate(['/license', license.id, 'edit']);
  }

  viewLicense(license: License) {
    this.router.navigate(['/license', license.id, 'view']);
  }

  createNewLicense() {
    this.router.navigate(['/license/new']);
  }

  getPageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}