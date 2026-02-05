import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ErrorService } from '../services/error.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private errorService: ErrorService
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {

    const token = sessionStorage.getItem('token');
    const expiry = sessionStorage.getItem('tokenExpiry');

    // If token or expiry is missing → force logout
    if (!token || !expiry) {
      this.errorService.showError('Session expired. Please login again.');
      this.router.navigate(['/login']);
      return false;
    }

    // Check if token is expired
    const now = Date.now();
    const expireTime = parseInt(expiry, 10);

    if (now > expireTime) {
      sessionStorage.clear();
      this.errorService.showError('Session expired. Please login again.');
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}

