import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BuildMaster } from '../models/build-master.model';
import { apiUrl } from 'src/environments/global';

@Injectable({
  providedIn: 'root'
})
export class BuildService {

  constructor(private http: HttpClient) {}

  getSessions() {
    return this.http.get(`${apiUrl}/admin/build/sessions`);
  }
}
