import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LogoutService } from '../services/logout.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export interface Build {
  id: string;
  buildNumber: string;
  version: string;
  releaseDate: string;
  status: 'Active' | 'Inactive' | 'Draft';
  notes: string;
}

@Component({
  selector: 'app-build-list',
  templateUrl: './build-list.component.html',
  styleUrls: ['./build-list.component.css']
})
export class BuildListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  builds: Build[] = [
    // Sample data - replace with actual API call
    {
      id: '1',
      buildNumber: 'B-1001',
      version: '1.0.0',
      releaseDate: '2023-11-01',
      status: 'Active',
      notes: 'Initial release'
    },
    {
      id: '2',
      buildNumber: 'B-1002',
      version: '1.0.1',
      releaseDate: '2023-11-03',
      status: 'Draft',
      notes: 'Bug fixes'
    }
  ];
  
  filteredBuilds: Build[] = [];
  searchTerm: string = '';
  selectedFilter: string = 'All';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  sortOrder: 'asc' | 'desc' = 'asc';
  sortBy: string = 'buildNumber';

  constructor(
    private router: Router,
    private logoutService: LogoutService
  ) { }

  ngOnInit() {
    this.filteredBuilds = [...this.builds];
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch() {
    this.filteredBuilds = this.builds.filter(build =>
      build.buildNumber.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      build.version.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      build.notes.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  onFilterChange(filter: string) {
    this.selectedFilter = filter;
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.builds];
    
    // Apply status filter
    if (this.selectedFilter !== 'All') {
      result = result.filter(build => build.status === this.selectedFilter);
    }
    
    // Apply search
    if (this.searchTerm) {
      result = result.filter(build =>
        Object.values(build).some(val => 
          val.toString().toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[this.sortBy as keyof Build];
      const bValue = b[this.sortBy as keyof Build];
      
      if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    this.filteredBuilds = result;
  }

  onSort(column: string) {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.applyFilters();
  }

  createNewBuild() {
    this.router.navigate(['/builds/new']);
  }

  editBuild(buildId: string) {
    this.router.navigate(['/builds', buildId, 'edit']);
  }

  viewBuild(buildId: string) {
    this.router.navigate(['/builds', buildId]);
  }

  onLogout() {
    this.logoutService.showConfirmation();
  }
}
