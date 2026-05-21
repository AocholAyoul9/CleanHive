import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(
    email: string,
    password: string,
    userType: 'client' | 'company' | 'employee',
  ): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, { email, password , userType });
  }

  register(
    userData: any,
    userType: 'client' | 'company' | 'employee',
  ): Observable<any> {
    const endpointMap: Record<string, string> = {
      client: '/auth/register/client',
      company: '/auth/register/company',
      employee: '/auth/register/employee',
    };
    return this.http.post(`${this.baseUrl}${endpointMap[userType]}`, userData);
  }

  refreshToken(refreshToken: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/refresh`, { refreshToken });
  }

  logout(username: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/logout`, { username });
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/me`);
  }
}
