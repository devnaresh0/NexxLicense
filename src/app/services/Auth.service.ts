import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { apiUrl } from 'src/environments/global';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${apiUrl}/login`, { username, password }, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    });
  }
}
