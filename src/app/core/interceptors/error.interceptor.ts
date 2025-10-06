import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorService } from '../../services/error.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private errorService: ErrorService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          errorMessage = this.getServerErrorMessage(error);
        }

        // Show the error using the error service
        this.errorService.showError(errorMessage, 'error');

        return throwError(() => error);
      })
    );
  }

  private getServerErrorMessage(error: HttpErrorResponse): string {
    // Log the complete error for debugging
    console.log('Raw error response:', error);

    // Check for error.domain (from your error response)
    if (error.error && error.error.domain) {
      return error.error.domain; // "This domain is already registered"
    }

    // Check for error.detail
    if (error.error && error.error.detail) {
      return error.error.detail;
    }

    // Check for error.message
    if (error.error && error.error.message) {
      return error.error.message;
    }

    // Check if error.error is a string
    if (error.error && typeof error.error === 'string') {
      return error.error;
    }

    // Check for nested error object
    if (error.error && error.error.error) {
      return error.error.error;
    }

    // Fallback to status-based messages
    switch (error.status) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized - Please log in';
      case 403:
        return 'Forbidden - You do not have permission';
      case 404:
        return 'The requested resource was not found';
      case 409:
        return 'A conflict occurred. This item already exists.';
      case 500:
        return 'Internal Server Error - Please try again later';
      default:
        return error.message || 'An unexpected error occurred';
    }
  }
}