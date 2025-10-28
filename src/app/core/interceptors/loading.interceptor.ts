import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse,
  HttpEventType
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, finalize, catchError } from 'rxjs/operators';
import { LoadingService } from '../../services/loading.service';

/**
 * HTTP interceptor that shows a loading indicator during HTTP requests
 */
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private totalRequests = 0;

  constructor(private loadingService: LoadingService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip loader for specific requests if needed
    if (request.url.includes('some-special-endpoint')) {
      return next.handle(request);
    }
    
    this.totalRequests++;
    
    // Only show loader if this is the first request
    if (this.totalRequests === 1) {
      this.loadingService.show();
    }

    return next.handle(request).pipe(
      // Handle successful responses
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            this.handleRequestComplete();
          }
        },
        error: (error) => {
          this.handleRequestComplete();
        }
      }),
      // Ensure loading is hidden when the request completes (success or error)
      finalize(() => {
        this.handleRequestComplete();
      }),
      // Re-throw the error after handling
      catchError((error: HttpErrorResponse) => {
        console.error('Error in request:', error);
        return throwError(() => error);
      })
    );
  }

  private handleRequestComplete(): void {
    this.totalRequests = Math.max(0, this.totalRequests - 1);
    if (this.totalRequests === 0) {
      this.loadingService.hide();
    }
  }
}