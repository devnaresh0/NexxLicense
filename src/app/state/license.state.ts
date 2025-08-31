import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LicenseHeader } from '../services/license.service';

export interface LicenseListState {
  licenses: LicenseHeader[];
  searchTerm: string;
  selectedFilter: string;
  currentPage: number;
  itemsPerPage: number;
  sortBy: string;
  sortOrder: 'asc';
}

const initialState: LicenseListState = {
  licenses: [],
  searchTerm: '',
  selectedFilter: 'All',
  currentPage: 1,
  itemsPerPage: 10,
  sortBy: 'search',
  sortOrder: 'asc'
};

@Injectable({
  providedIn: 'root'
})
export class LicenseState {
  private state$ = new BehaviorSubject<LicenseListState>(initialState);

  // Selectors
  getState$(): Observable<LicenseListState> {
    return this.state$.asObservable();
  }

  getCurrentState(): LicenseListState {
    return this.state$.getValue();
  }

  // Actions
  updateState(partialState: Partial<LicenseListState>): void {
    this.state$.next({
      ...this.state$.getValue(),
      ...partialState
    });
  }

  // Reset state when needed (e.g., on logout)
  resetState(): void {
    this.state$.next(initialState);
  }
}
