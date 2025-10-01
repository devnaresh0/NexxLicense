import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../../environments/global';

// Define the shape of an audit entry
export interface LicenseAudit {
  id: number;
  adminId: number;
  adminName: string;
  licenseId: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  oldData: string | null;
  newData: string | null;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  // Adjust this to match your backend endpoint
  private baseUrl = `${apiUrl}/licenses/audit`;

  constructor(private http: HttpClient) {}

  /**
   * Fetch all audit logs for a given domain.
   * Example: GET /licenses/audit?domain=acme-corp.com
   */
  getAuditsByDomain(domain: string): Observable<LicenseAudit[]> {
    return this.http.get<LicenseAudit[]>(`${this.baseUrl}?domain=${domain}`);
  }

  /**
   * (Optional) Fetch all audits without filtering by domain
   * Example: GET /licenses/audit
   */
  getAllAudits(): Observable<LicenseAudit[]> {
    return this.http.get<LicenseAudit[]>(this.baseUrl);
  }
}