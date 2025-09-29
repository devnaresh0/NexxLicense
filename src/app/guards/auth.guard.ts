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
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const adminId = localStorage.getItem('adminId');
    const username = localStorage.getItem('username');

    if (!adminId || !username) {
      this.errorService.showError('Session expired. Please login again.');
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}
