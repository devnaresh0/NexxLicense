import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { ErrorService } from "src/app/services/error.service";

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private errorService: ErrorService
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // Bypass login API
    if (req.url.endsWith('/login') || req.url.endsWith('/health') || req.url.endsWith('/mark-executed') || req.url.endsWith('/mark-updatelog')) {
      return next.handle(req);
    }

    const token = sessionStorage.getItem('token');
    const expiry = sessionStorage.getItem('tokenExpiry');

    // Block outgoing request if token missing or expired
    if (!token || !expiry || Date.now() > parseInt(expiry, 10)) {

      sessionStorage.clear();
      this.errorService.showError('Session expired. Please login again.', 'error');
      this.router.navigate(['/login']);

      return throwError('Token missing or expired');
    }

    // Attach token to valid requests
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    // Handle backend 401 errors
    return next.handle(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          sessionStorage.clear();
          this.errorService.showError('Session expired. Please login again.', 'error');
          this.router.navigate(['/login']);
        }
        return throwError(error);
      })
    );
  }
}
