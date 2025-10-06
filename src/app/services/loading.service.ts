import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, timer, Observable } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LoadingService implements OnDestroy {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();
  private loadingStartTime: number | null = null;
  
  // Public observable for components to subscribe to
  public readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  /**
   * Shows the loading indicator
   */
  show(): void {
    if (!this.loadingSubject.value) {
      this.loadingStartTime = Date.now();
      this.loadingSubject.next(true);
    }
  }

  /**
   * Hides the loading indicator immediately
   */
  hide(): void {
    if (this.loadingSubject.value) {
      this.loadingSubject.next(false);
      this.loadingStartTime = null;
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
