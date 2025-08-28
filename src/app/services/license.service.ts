// services/license.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface License {
  id: string;
  tenantId: string;
  domain: string;
  customer: string;
  status: string;
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
  tenantId: string;
  domain: string;
  customerName: string;
  isActive: boolean;
}

export interface LicenseDetail {
  header: LicenseHeader;
  modules: LicenseModule[];
}

@Injectable({
  providedIn: 'root'
})
export class LicenseService {

  private apiUrl = 'http://localhost:9090/api';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  /**
   * Get all licenses
   */

  getLicenses(): Observable<License[]> {
    return this.http.get<any[]>(`${this.apiUrl}/licenses`).pipe(
      map((response: any[]) => {
        return response.map(item => ({
          id: item.header.id,
          tenantId: item.header.tenantId,
          domain: item.header.domain,
          customer: item.header.customerName, // 👈 Map customerName to customer
          status: item.header.active ? 'Active' : 'Inactive'
        }));
      }),
      catchError(this.handleError<License[]>('getLicenses', []))
    );
  }
  // Get license by ID
  getLicenseDetails(id: string): Observable<LicenseDetail> {
    return this.http.get<LicenseDetail>(`${this.apiUrl}/licenses/${id}`)
      .pipe(
        catchError(this.handleError<LicenseDetail>('getLicense'))
      );
  }

  /**
   * Save license (create or update)
   */
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

  /**
   * Create new license
   */
  createLicense(license: any): Observable<any> {
    console.log("creating license", license)
    return this.http.post<any>(`${this.apiUrl}/licenses`, license, this.httpOptions)
      .pipe(
        catchError(this.handleError<any>('createLicense'))
      );

    console.log('Creating license:', license);
    return of({ success: true, id: Date.now(), message: 'License created successfully' });
  }

  /**
   * Update existing license
   */
  updateLicense(license: any): Observable<any> {
    console.log("updating license", license)
    return this.http.put<any>(`${this.apiUrl}/licenses/${license.id}`, license, this.httpOptions)
      .pipe(
        catchError(this.handleError<any>('updateLicense'))
      );

    console.log('Updating license:', license);
    return of({ success: true, message: 'License updated successfully' });
  }

  // Get available modules
  getAvailableModules(): Observable<string[]> {
    const modules = [
      'Merchandising',
      'Inventory',
      'Sales',
      'Purchasing',
      'Accounting',
      'HR Management',
      'Customer Management',
      'Reporting',
      'Analytics',
      'Security Management'
    ];
    return of(modules);
  }

  /**
   * Validate license data
   */
  validateLicense(license: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!license.header.domain || license.header.domain.trim() === '') {
      errors.push('Domain is required');
    }

    if (!license.header.customerName || license.header.customerName.trim() === '') {
      errors.push('Customer name is required');
    }

    if (!license.modules || license.modules.length === 0) {
      errors.push('At least one module is required');
    } else {
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
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Handle Http operation that failed
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);

      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
}