import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { LoadingService } from '../../../services/loading.service';
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-loader',
  template: `
    <div class="loader-overlay" *ngIf="loading" @fadeInOut>
      <div class="spinner"></div>
      <div class="loading-text">Loading...</div>
    </div>
  `,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms', style({ opacity: 0 }))
      ])
    ])
  ],
  styles: [`
    .loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 99999;
      pointer-events: auto;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(255, 255, 255, 0.2);
      border-top: 5px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      margin-bottom: 15px;
    }
    .loading-text {
      color: white;
      font-size: 16px;
      font-weight: 500;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class LoaderComponent implements OnInit, OnDestroy {
  loading = false;
  private loadingSubscription: Subscription | undefined;

  constructor(
    private loadingService: LoadingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadingSubscription = this.loadingService.loading$.subscribe(loading => {
      this.loading = loading;
      this.cdr.detectChanges(); // Manually trigger change detection
    });
  }

  ngOnDestroy() {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
  }
}
