import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define the shape of an audit entry
export interface LicenseAudit {
  id: number;
  action: 'CREATE' | 'UPDATE';   // matches your backend enum
  oldData: string | null;        // JSON string from DB
  newData: string | null;        // JSON string from DB
  timestamp: string;             // ISO date string
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  // Adjust this to match your backend endpoint
  private baseUrl = 'http://localhost:9090/NexxLicense/licenses/audit';

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