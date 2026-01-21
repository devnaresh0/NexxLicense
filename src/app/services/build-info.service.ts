import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from 'src/environments/global';

@Injectable({
  providedIn: 'root'
})
export class BuildInfoService {

  constructor(private http: HttpClient) { }

  getBuildInfo(id: number): Observable<any> {
    return this.http.get(`${apiUrl}/admin/build/info/${id}`);
  }

  markCancelled(licenseId: number, fileId: number): Observable<any> {
    return this.http.post(`${apiUrl}/client/mark-cancelled`, { licenseId, fileId });
  }

  cancelUploadedBuild(id: number) {
    return this.http.post(`${apiUrl}/api/uploaded-build-cancel`, null, { params: { id: String(id) } });
  }
}
