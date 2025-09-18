// services/license.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ErrorService } from './error.service';

export interface License {
  id: string;
  serialNumber: number;
  domain: string;
  customerName: string;
  active: boolean;
}

export interface LicenseModule {
  id: number;
  module: string;
  numberOfUsers: number;
  startDate: string;
  endDate: string;
}

export interface LicenseHeader {
  id: number,
  serialNumber: number;
  domain: string;
  customerName: string;
  active: boolean;
}

export interface LicenseDetail {
  header: LicenseHeader;
  modules: LicenseModule[];
}

export interface ModuleResponse {
  id: number;
  moduleName: string;
}

@Injectable({
  providedIn: 'root'
})
export class LicenseService {

  private apiUrl = 'http://localhost:9650/api';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(
    private http: HttpClient,
    private errorService: ErrorService
  ) { }

  // Get all licenses
  getLicenses(): Observable<License[]> {
    return this.http.get<any[]>(`${this.apiUrl}/licenses`).pipe(
      map(response => {
        // Transform the nested response into a flat array
        return response.map(item => ({
          id: item.header.id,
          serialNumber: item.header.serialNumber,
          domain: item.header.domain,
          customerName: item.header.customerName,
          active: item.header.active
        }));
      }),
      catchError(this.handleError<License[]>('getLicenses', []))
    );
  }

  getModules(): Observable<ModuleResponse[]> {
    return this.http.get<ModuleResponse[]>(`${this.apiUrl}/modules`)
      .pipe(
        catchError(this.handleError<ModuleResponse[]>('getModules', []))
      );
  }

  // Get license by ID
  getLicenseDetails(id: string): Observable<LicenseDetail> {
    return this.http.get<LicenseDetail>(`${this.apiUrl}/licenses/${id}`)
      .pipe(
        catchError(this.handleError<LicenseDetail>('getLicense'))
      );
  }

  // Save license (create or update)
  saveLicense(license: any): Observable<any> {
    console.log(license.id)
    if (+license.id && +license.id > 0) {
      // Update existing license
      return this.updateLicense(license);
    } else {
      // Create new license
      return this.createLicense(license);
    }
  }

  // Create new license
  createLicense(license: any): Observable<any> {
    console.log("creating license", license)
    return this.http.post<any>(`${this.apiUrl}/licenses`, license, this.httpOptions)
      .pipe(
        catchError(this.handleError<any>('createLicense'))
      );
  }

  //  Update existing license
  updateLicense(license: any): Observable<any> {
    console.log("updating license", license)
    return this.http.put<any>(`${this.apiUrl}/licenses/${license.id}`, license, this.httpOptions)
      .pipe(
        catchError(this.handleError<any>('updateLicense'))
      );
  }

  // Validate license data
  validateLicense(license: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$/;

    if (!license.header.domain || license.header.domain.trim() === '') {
      errors.push('Domain is required');
    } else if (!domainRegex.test(license.header.domain)) {
      errors.push('Domain can only contain letters, numbers, dots, and hyphens, and cannot start or end with a dot or hyphen');
    }

    if (!license.header.customerName || license.header.customerName.trim() === '') {
      errors.push('Customer name is required');
    }

    license.modules.forEach((module: LicenseModule, index: number) => {
      if (!module.module || module.module.trim() === '') {
        errors.push(`Module name is required for row ${index + 1}`);
      }
      if (!module.numberOfUsers || module.numberOfUsers < 1) {
        errors.push(`Number of users must be at least 1 for row ${index + 1}`);
      }
      if (!module.startDate || module.startDate.trim() === '') {
        errors.push(`Start date is required for row ${index + 1}`);
      }
      if (!module.endDate || module.endDate.trim() === '') {
        errors.push(`End date is required for row ${index + 1}`);
      }
      // Add date validation
      if (module.startDate && module.endDate) {
        const startDate = new Date(module.startDate);
        const endDate = new Date(module.endDate);

        // Check if dates are valid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          errors.push(`Invalid date format in row ${index + 1}`);
        } else if (startDate > endDate) {
          errors.push(`Start date cannot be after end date in row ${index + 1}`);
        }
      }
    });


    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Handle Http operation that failed
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);

      let errorMessage = 'An error occurred';

      // Check if server sent a response with an error message
      if (error.error) {
        // Handle case where error is a JSON string
        if (typeof error.error === 'string') {
          try {
            const parsedError = JSON.parse(error.error);
            // Handle object with specific error properties (like serialNumber)
            if (typeof parsedError === 'object' && !Array.isArray(parsedError)) {
              // Extract the first error message from the object
              const errorKey = Object.keys(parsedError)[0];
              errorMessage = parsedError[errorKey];
            } else {
              errorMessage = parsedError.message || parsedError.error || error.error;
            }
          } catch (e) {
            // If not JSON, use the string as is
            errorMessage = error.error;
          }
        }
        // Handle case where error is already an object
        else if (typeof error.error === 'object') {
          // Handle object with specific error properties (like serialNumber)
          const errorObj = error.error;
          const errorKeys = Object.keys(errorObj);

          // If it has properties like { serialNumber: 'error message' }
          if (errorKeys.length > 0 && typeof errorObj[errorKeys[0]] === 'string') {
            errorMessage = errorObj[errorKeys[0]];
          }
          // If it has a standard message property
          else if (error.error.message) {
            errorMessage = error.error.message;
          }
          // Fallback to stringify if we can't extract a message
          else {
            errorMessage = JSON.stringify(error.error);
          }
        }

        // If we still don't have a specific message, use status-based messages
        if (errorMessage === 'An error occurred' && error.status) {
          switch (error.status) {
            case 0:
              errorMessage = 'Could not connect to server. Please check your connection.';
              break;
            case 400:
              errorMessage = 'Bad request. Please check your input.';
              break;
            case 401:
              errorMessage = 'Unauthorized. Please log in again.';
              break;
            case 403:
              errorMessage = 'You do not have permission to perform this action.';
              break;
            case 404:
              errorMessage = 'The requested resource was not found.';
              break;
            case 409:
              errorMessage = 'Conflict: This resource already exists or is in use.';
              break;
            case 500:
              errorMessage = 'Server error occurred. Please try again later.';
              break;
            default:
              errorMessage = `Server returned status code ${error.status}`;
          }
        }

        // Show error to user
        this.errorService.showError(errorMessage, 'error');

        // Let the app keep running by returning an empty result
        return of(result as T);
      };
    }
  }
}