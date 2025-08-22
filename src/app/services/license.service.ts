// services/license.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface License {
  id: number;
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

  private apiUrl = 'http://localhost:3000/api'; // Replace with your actual API URL

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  // Mock data for development
  private mockLicenses: License[] = [
    { id: 1, domain: 'Compulynx', customer: 'Compulynx Limited', status: 'Active' },
    { id: 2, domain: 'Flemingo', customer: 'Kenya Airport Authority', status: 'Active' },
    { id: 3, domain: 'OTW', customer: 'Onn The way', status: 'Active' },
    { id: 4, domain: 'TestDomain', customer: 'Test Customer Inc', status: 'Inactive' },
    { id: 5, domain: 'Way', customer: 'The way', status: 'inactive' },
    { id: 6, domain: 'SkyNet', customer: 'SkyNet Technologies', status: 'Active' },
    { id: 7, domain: 'TechWorld', customer: 'TechWorld Solutions', status: 'Inactive' },
    { id: 8, domain: 'GreenLeaf', customer: 'GreenLeaf Organics', status: 'Active' },
    { id: 9, domain: 'BlueWave', customer: 'BlueWave Systems', status: 'Inactive' },
    { id: 10, domain: 'NextGen', customer: 'NextGen Innovations', status: 'Active' },
    { id: 11, domain: 'PrimeSoft', customer: 'PrimeSoft Global', status: 'Inactive' },
    { id: 12, domain: 'Sunrise', customer: 'Sunrise Retail Ltd', status: 'Active' },
    { id: 13, domain: 'IronClad', customer: 'IronClad Security Inc', status: 'Active' },
    { id: 14, domain: 'AeroLink', customer: 'AeroLink Airlines', status: 'Inactive' },
    { id: 15, domain: 'MediCore', customer: 'MediCore Healthcare', status: 'Active' },
    { id: 16, domain: 'EduSmart', customer: 'EduSmart Academy', status: 'Inactive' },
    { id: 17, domain: 'RoboX', customer: 'RoboX Robotics', status: 'Active' },
    { id: 18, domain: 'UrbanTech', customer: 'UrbanTech Developers', status: 'Active' },
    { id: 19, domain: 'EcoFarm', customer: 'EcoFarm Produce', status: 'Inactive' },
    { id: 20, domain: 'TravelX', customer: 'TravelX Adventures', status: 'Active' },
    { id: 1, domain: 'Compulynx', customer: 'Compulynx Limited', status: 'Active' },
    { id: 2, domain: 'Flemingo', customer: 'Kenya Airport Authority', status: 'Active' },
    { id: 3, domain: 'OTW', customer: 'Onn The way', status: 'Active' },
    { id: 4, domain: 'TestDomain', customer: 'Test Customer Inc', status: 'Inactive' },
    { id: 5, domain: 'Way', customer: 'The way', status: 'inactive' },
    { id: 6, domain: 'SkyNet', customer: 'SkyNet Technologies', status: 'Active' },
    { id: 7, domain: 'TechWorld', customer: 'TechWorld Solutions', status: 'Inactive' },
    { id: 8, domain: 'GreenLeaf', customer: 'GreenLeaf Organics', status: 'Active' },
    { id: 9, domain: 'BlueWave', customer: 'BlueWave Systems', status: 'Inactive' },
    { id: 10, domain: 'NextGen', customer: 'NextGen Innovations', status: 'Active' },
    { id: 11, domain: 'PrimeSoft', customer: 'PrimeSoft Global', status: 'Inactive' },
    { id: 12, domain: 'Sunrise', customer: 'Sunrise Retail Ltd', status: 'Active' },
    { id: 13, domain: 'IronClad', customer: 'IronClad Security Inc', status: 'Active' },
    { id: 14, domain: 'AeroLink', customer: 'AeroLink Airlines', status: 'Inactive' },
    { id: 15, domain: 'MediCore', customer: 'MediCore Healthcare', status: 'Active' },
    { id: 16, domain: 'EduSmart', customer: 'EduSmart Academy', status: 'Inactive' },
    { id: 17, domain: 'RoboX', customer: 'RoboX Robotics', status: 'Active' },
    { id: 18, domain: 'UrbanTech', customer: 'UrbanTech Developers', status: 'Active' },
    { id: 19, domain: 'EcoFarm', customer: 'EcoFarm Produce', status: 'Inactive' },
    { id: 20, domain: 'TravelX', customer: 'TravelX Adventures', status: 'Active' },
    { id: 1, domain: 'Compulynx', customer: 'Compulynx Limited', status: 'Active' },
    { id: 2, domain: 'Flemingo', customer: 'Kenya Airport Authority', status: 'Active' },
    { id: 3, domain: 'OTW', customer: 'Onn The way', status: 'Active' },
    { id: 4, domain: 'TestDomain', customer: 'Test Customer Inc', status: 'Inactive' },
    { id: 5, domain: 'Way', customer: 'The way', status: 'inactive' },
    { id: 6, domain: 'SkyNet', customer: 'SkyNet Technologies', status: 'Active' },
    { id: 7, domain: 'TechWorld', customer: 'TechWorld Solutions', status: 'Inactive' },
    { id: 8, domain: 'GreenLeaf', customer: 'GreenLeaf Organics', status: 'Active' },
    { id: 9, domain: 'BlueWave', customer: 'BlueWave Systems', status: 'Inactive' },
    { id: 10, domain: 'NextGen', customer: 'NextGen Innovations', status: 'Active' },
    { id: 11, domain: 'PrimeSoft', customer: 'PrimeSoft Global', status: 'Inactive' },
    { id: 12, domain: 'Sunrise', customer: 'Sunrise Retail Ltd', status: 'Active' },
    { id: 13, domain: 'IronClad', customer: 'IronClad Security Inc', status: 'Active' },
    { id: 14, domain: 'AeroLink', customer: 'AeroLink Airlines', status: 'Inactive' },
    { id: 15, domain: 'MediCore', customer: 'MediCore Healthcare', status: 'Active' },
    { id: 16, domain: 'EduSmart', customer: 'EduSmart Academy', status: 'Inactive' },
    { id: 17, domain: 'RoboX', customer: 'RoboX Robotics', status: 'Active' },
    { id: 18, domain: 'UrbanTech', customer: 'UrbanTech Developers', status: 'Active' },
    { id: 19, domain: 'EcoFarm', customer: 'EcoFarm Produce', status: 'Inactive' },
    { id: 20, domain: 'TravelX', customer: 'TravelX Adventures', status: 'Active' },
    { id: 1, domain: 'Compulynx', customer: 'Compulynx Limited', status: 'Active' },
    { id: 2, domain: 'Flemingo', customer: 'Kenya Airport Authority', status: 'Active' },
    { id: 3, domain: 'OTW', customer: 'Onn The way', status: 'Active' },
    { id: 4, domain: 'TestDomain', customer: 'Test Customer Inc', status: 'Inactive' },
    { id: 5, domain: 'Way', customer: 'The way', status: 'inactive' },
    { id: 6, domain: 'SkyNet', customer: 'SkyNet Technologies', status: 'Active' },
    { id: 7, domain: 'TechWorld', customer: 'TechWorld Solutions', status: 'Inactive' },
    { id: 8, domain: 'GreenLeaf', customer: 'GreenLeaf Organics', status: 'Active' },
    { id: 9, domain: 'BlueWave', customer: 'BlueWave Systems', status: 'Inactive' },
    { id: 10, domain: 'NextGen', customer: 'NextGen Innovations', status: 'Active' },
    { id: 11, domain: 'PrimeSoft', customer: 'PrimeSoft Global', status: 'Inactive' },
    { id: 12, domain: 'Sunrise', customer: 'Sunrise Retail Ltd', status: 'Active' },
    { id: 13, domain: 'IronClad', customer: 'IronClad Security Inc', status: 'Active' },
    { id: 14, domain: 'AeroLink', customer: 'AeroLink Airlines', status: 'Inactive' },
    { id: 15, domain: 'MediCore', customer: 'MediCore Healthcare', status: 'Active' },
    { id: 16, domain: 'EduSmart', customer: 'EduSmart Academy', status: 'Inactive' },
    { id: 17, domain: 'RoboX', customer: 'RoboX Robotics', status: 'Active' },
    { id: 18, domain: 'UrbanTech', customer: 'UrbanTech Developers', status: 'Active' },
    { id: 19, domain: 'EcoFarm', customer: 'EcoFarm Produce', status: 'Inactive' },
    { id: 20, domain: 'TravelX', customer: 'TravelX Adventures', status: 'Active' },
    { id: 1, domain: 'Compulynx', customer: 'Compulynx Limited', status: 'Active' },
    { id: 2, domain: 'Flemingo', customer: 'Kenya Airport Authority', status: 'Active' },
    { id: 3, domain: 'OTW', customer: 'Onn The way', status: 'Active' },
    { id: 4, domain: 'TestDomain', customer: 'Test Customer Inc', status: 'Inactive' },
    { id: 5, domain: 'Way', customer: 'The way', status: 'inactive' },
    { id: 6, domain: 'SkyNet', customer: 'SkyNet Technologies', status: 'Active' },
    { id: 7, domain: 'TechWorld', customer: 'TechWorld Solutions', status: 'Inactive' },
    { id: 8, domain: 'GreenLeaf', customer: 'GreenLeaf Organics', status: 'Active' },
    { id: 9, domain: 'BlueWave', customer: 'BlueWave Systems', status: 'Inactive' },
    { id: 10, domain: 'NextGen', customer: 'NextGen Innovations', status: 'Active' },
    { id: 11, domain: 'PrimeSoft', customer: 'PrimeSoft Global', status: 'Inactive' },
    { id: 12, domain: 'Sunrise', customer: 'Sunrise Retail Ltd', status: 'Active' },
    { id: 13, domain: 'IronClad', customer: 'IronClad Security Inc', status: 'Active' },
    { id: 14, domain: 'AeroLink', customer: 'AeroLink Airlines', status: 'Inactive' },
    { id: 15, domain: 'MediCore', customer: 'MediCore Healthcare', status: 'Active' },
    { id: 16, domain: 'EduSmart', customer: 'EduSmart Academy', status: 'Inactive' },
    { id: 17, domain: 'RoboX', customer: 'RoboX Robotics', status: 'Active' },
    { id: 18, domain: 'UrbanTech', customer: 'UrbanTech Developers', status: 'Active' },
    { id: 19, domain: 'EcoFarm', customer: 'EcoFarm Produce', status: 'Inactive' },
    { id: 20, domain: 'TravelX', customer: 'TravelX Adventures', status: 'Active' },
    { id: 1, domain: 'Compulynx', customer: 'Compulynx Limited', status: 'Active' },
    { id: 2, domain: 'Flemingo', customer: 'Kenya Airport Authority', status: 'Active' },
    { id: 3, domain: 'OTW', customer: 'Onn The way', status: 'Active' },
    { id: 4, domain: 'TestDomain', customer: 'Test Customer Inc', status: 'Inactive' },
    { id: 5, domain: 'Way', customer: 'The way', status: 'inactive' },
    { id: 6, domain: 'SkyNet', customer: 'SkyNet Technologies', status: 'Active' },
    { id: 7, domain: 'TechWorld', customer: 'TechWorld Solutions', status: 'Inactive' },
    { id: 8, domain: 'GreenLeaf', customer: 'GreenLeaf Organics', status: 'Active' },
    { id: 9, domain: 'BlueWave', customer: 'BlueWave Systems', status: 'Inactive' },
    { id: 10, domain: 'NextGen', customer: 'NextGen Innovations', status: 'Active' },
    { id: 11, domain: 'PrimeSoft', customer: 'PrimeSoft Global', status: 'Inactive' },
    { id: 12, domain: 'Sunrise', customer: 'Sunrise Retail Ltd', status: 'Active' },
    { id: 13, domain: 'IronClad', customer: 'IronClad Security Inc', status: 'Active' },
    { id: 14, domain: 'AeroLink', customer: 'AeroLink Airlines', status: 'Inactive' },
    { id: 15, domain: 'MediCore', customer: 'MediCore Healthcare', status: 'Active' },
    { id: 16, domain: 'EduSmart', customer: 'EduSmart Academy', status: 'Inactive' },
    { id: 17, domain: 'RoboX', customer: 'RoboX Robotics', status: 'Active' },
    { id: 18, domain: 'UrbanTech', customer: 'UrbanTech Developers', status: 'Active' },
    { id: 19, domain: 'EcoFarm', customer: 'EcoFarm Produce', status: 'Inactive' },
    { id: 20, domain: 'TravelX', customer: 'TravelX Adventures', status: 'Active' },
  ];

  private mockLicenseDetails: { [key: number]: LicenseDetail } = {
    1: {
      header: {
        tenantId: 'TN001',
        domain: 'Compulynx',
        customerName: 'Compulynx Limited',
        isActive: true
      },
      modules: [
        {
          id: 1,
          module: 'Merchandising',
          numberOfUsers: 2,
          startDate: '1-Jan-2025',
          endDate: '31-Jan-2026'
        },
        {
          id: 2,
          module: 'Inventory',
          numberOfUsers: 5,
          startDate: '1-Jan-2025',
          endDate: '31-Jan-2025'
        }
      ]
    },
    2: {
      header: {
        tenantId: 'TN002',
        domain: 'Flemingo',
        customerName: 'Kenya Airport Authority',
        isActive: true
      },
      modules: [
        {
          id: 1,
          module: 'Sales',
          numberOfUsers: 10,
          startDate: '1-Jan-2025',
          endDate: '31-Dec-2025'
        },
        {
          id: 2,
          module: 'Customer Management',
          numberOfUsers: 3,
          startDate: '1-Jan-2025',
          endDate: '31-Dec-2025'
        }
      ]
    },
    3: {
      header: {
        tenantId: 'TN003',
        domain: 'OTW',
        customerName: 'Onn The way',
        isActive: true
      },
      modules: [
        {
          id: 1,
          module: 'Inventory',
          numberOfUsers: 1,
          startDate: '1-Jan-2025',
          endDate: '30-Jun-2025'
        }
      ]
    }
  };

  constructor(private http: HttpClient) { }

  /**
   * Get all licenses
   */
  getLicenses(): Observable<License[]> {
    // For development, return mock data
    // Replace with actual HTTP call when backend is ready
    // return this.http.get<License[]>(`${this.apiUrl}/licenses`)
    //   .pipe(
    //     catchError(this.handleError<License[]>('getLicenses', []))
    //   );
    return of(this.mockLicenses);
  }

  /**
   * Get license by ID
   */
  getLicense(id: number): Observable<LicenseDetail> {
    // For development, return mock data
    // Replace with actual HTTP call when backend is ready
    // return this.http.get<LicenseDetail>(`${this.apiUrl}/licenses/${id}`)
    //   .pipe(
    //     catchError(this.handleError<LicenseDetail>('getLicense'))
    //   );

    const mockDetail = this.mockLicenseDetails[id];
    if (mockDetail) {
      return of(mockDetail);
    } else {
      return of({
        header: {
          tenantId: `TN${id.toString().padStart(3, '0')}`,
          domain: '',
          customerName: '',
          isActive: true
        },
        modules: []
      });
    }
  }

  /**
   * Save license (create or update)
   */
  saveLicense(license: any): Observable<any> {
    if (license.id && license.id > 0) {
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
    // For development, simulate API response
    // Replace with actual HTTP call when backend is ready
    // return this.http.post<any>(`${this.apiUrl}/licenses`, license, this.httpOptions)
    //   .pipe(
    //     catchError(this.handleError<any>('createLicense'))
    //   );

    console.log('Creating license:', license);
    return of({ success: true, id: Date.now(), message: 'License created successfully' });
  }

  /**
   * Update existing license
   */
  updateLicense(license: any): Observable<any> {
    // For development, simulate API response
    // Replace with actual HTTP call when backend is ready
    // return this.http.put<any>(`${this.apiUrl}/licenses/${license.id}`, license, this.httpOptions)
    //   .pipe(
    //     catchError(this.handleError<any>('updateLicense'))
    //   );

    console.log('Updating license:', license);
    return of({ success: true, message: 'License updated successfully' });
  }

  /**
   * Delete license
   */
  deleteLicense(id: number): Observable<any> {
    // For development, simulate API response
    // Replace with actual HTTP call when backend is ready
    // return this.http.delete<any>(`${this.apiUrl}/licenses/${id}`, this.httpOptions)
    //   .pipe(
    //     catchError(this.handleError<any>('deleteLicense'))
    //   );

    console.log('Deleting license:', id);
    return of({ success: true, message: 'License deleted successfully' });
  }

  /**
   * Search licenses
   */
  searchLicenses(searchTerm: string, status?: string): Observable<License[]> {
    let filtered = [...this.mockLicenses];

    if (status && status !== 'All') {
      filtered = filtered.filter(license =>
        license.status.toLowerCase() === status.toLowerCase()
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(license =>
        license.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.customer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return of(filtered);
  }

  /**
   * Get available modules
   */
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