import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { ErrorService } from "./error.service";

@Injectable({ providedIn: 'root' })
export class IdleService {

  private timeout: any;
  private idleLimit = 15 * 60 * 1000; // 15 minutes

  constructor(private router: Router, private errorService: ErrorService) {
    this.start();
  }

  start() {
    this.reset();

    window.addEventListener('mousemove', () => this.reset());
    window.addEventListener('keydown', () => this.reset());
    window.addEventListener('click', () => this.reset());
  }

  reset() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      sessionStorage.clear();
      this.router.navigate(['/login']);
      this.errorService.showError('You have been logged out due to inactivity.', 'error');
    }, this.idleLimit);
  }
}
