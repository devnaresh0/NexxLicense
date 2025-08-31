import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ErrorMessage {
  message: string;
  type: 'error' | 'success' | 'info' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private errorSubject = new BehaviorSubject<ErrorMessage | null>(null);
  error$ = this.errorSubject.asObservable();

  private timeoutId: any;

  showError(message: string, type: 'error' | 'success' | 'info' | 'warning' = 'error') {
    // Clear any existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.errorSubject.next({ message, type });

    // Auto-hide after a delay (3 seconds for success/info/warning, 5 seconds for errors)
    const delay = type === 'error' ? 5000 : 3000;
    this.timeoutId = setTimeout(() => {
      this.clearError();
      this.timeoutId = null;
    }, delay);
  }

  clearError() {
    this.errorSubject.next(null);
  }
}
