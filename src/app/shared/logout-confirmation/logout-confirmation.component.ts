import { Component, OnDestroy } from '@angular/core';
import { LogoutService } from '../../services/logout.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-logout-confirmation',
  templateUrl: './logout-confirmation.component.html',
  styleUrls: ['./logout-confirmation.component.css']
})
export class LogoutConfirmationComponent implements OnDestroy {
  isOpen = false;
  username: string | null = null;
  adminId: string | null = null;
  private subscription: Subscription | null = null;

  constructor(private logoutService: LogoutService) {
    this.subscription = this.logoutService.showConfirm$.subscribe({
      next: (show) => {
        this.isOpen = show;
        // Read user info from localStorage every time the dialog is shown
        if (show) {
          this.username = localStorage.getItem('username');
          this.adminId = localStorage.getItem('adminId');
        }
      },
      error: (error) => {
        console.error('Error in logout confirmation:', error);
        this.isOpen = false;
      }
    });
  }

  onConfirm() {
    try {
      this.logoutService.confirmLogout(true);
    } catch (error) {
      console.error('Error confirming logout:', error);
    }
  }

  onCancel() {
    try {
      this.logoutService.confirmLogout(false);
    } catch (error) {
      console.error('Error cancelling logout:', error);
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }
}
