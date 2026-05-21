import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Company } from '../models/company.model';
import { ServiceModel } from '../../../shared/models/service.model';
import { Booking, CreateBookingRequest } from '../../../features/booking/models/booking.model';
import { NearbyCompany } from '../../client/models/client.model';
import { environment } from '../../../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class CompaniesApiService {
 
private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ------------ Companies --------------

  getNearByCompanies(
    lat: number,
    lng: number,
    radiusKm: number
  ): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.baseUrl}/companies/nearby`, {
      params: {
        lat: lat.toString(),
        lng: lng.toString(),
        radiusKm: radiusKm.toString(),
      },
    });
  }

  getCompanyById(id: string): Observable<Company> {
    return this.http.get<Company>(`${this.baseUrl}/companies/${id}`);
  }

  getCompanyAllCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.baseUrl}/companies`);
  }

  registerCompany(data: Partial<Company>): Observable<Company> {
    return this.http.post<Company>(`${this.baseUrl}/companies`, data);
  }

  updateCompany(id: string, data: Partial<Company>): Observable<Company> {
    return this.http.put<Company>(`${this.baseUrl}/companies/${id}`, data);
  }

  searchCompanies(query: string): Observable<NearbyCompany[]> {
    return this.http.post<NearbyCompany[]>(`${this.baseUrl}/companies/search`, { address: query });
  }

  // ------------ Company Services --------------

  getCompanyService(): Observable<ServiceModel[]> {
    return this.http.get<ServiceModel[]>(
      `${this.baseUrl}/services/company/me`
    );
  }

  createCompanyService(service: ServiceModel): Observable<ServiceModel> {
    return this.http.post<ServiceModel>(`${this.baseUrl}/services`, service);
  }

  updateCompanyService(
    serviceId: string,
    service: ServiceModel
  ): Observable<ServiceModel> {
    return this.http.put<ServiceModel>(
      `${this.baseUrl}/services/${serviceId}`,
      service
    );
  }

  deleteCompanyService(serviceId: string): Observable<ServiceModel> {
    return this.http.delete<ServiceModel>(
      `${this.baseUrl}/services/delete/${serviceId}`
    );
  }

  // ------------ Company Bookings --------------

  CreateBooking(
    companyId: string,
    booking: CreateBookingRequest
  ): Observable<Booking> {
    return this.http.post<Booking>(
      `${this.baseUrl}/companies/${companyId}/bookings`,
      booking
    );
  }

  getCompanyBookings(companyId: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(
      `${this.baseUrl}/companies/${companyId}/bookings`
    );
  }

  cancelBooking(companyId: string, bookingId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/companies/${companyId}/bookings/${bookingId}`
    );
  }

  assignBookingToEmployee(
    companyId: string,
    bookingId: string,
    employeeId: string
  ): Observable<any> {
    return this.http.patch<any>(
      `${this.baseUrl}/companies/${companyId}/bookings/${bookingId}/assign`,
      null,
      { params: { employeeId } }
    );
  }

  // ------------ Company Employees --------------

  getCompanyEmployees(companyId: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/companies/${companyId}/employees`
    );
  }

  addCompanyEmployee(companyId: string, employeeData: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/companies/${companyId}/employees`,
      employeeData
    );
  }

  deleteCompanyEmployee(
    companyId: string,
    employeeId: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/companies/${companyId}/employees/${employeeId}`
    );
  }

  updateCompanyEmployee(
    companyId: string,
    employeeId: string,
    employeeData: any
  ): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrl}/companies/${companyId}/employees/${employeeId}`,
      employeeData
    );
  }

  // ------------ Company Subscriptions --------------

  subscripCompany(companyId: string, plan: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/subscribes`, {
      companyId,
      plan,
    });
  }

  renewSubscription(companyId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/subscribes/${companyId}`, {});
  }

  getCompanySubscription(companyId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/subscribes/${companyId}`);
  }

  // ------------ Client Auth --------------
  
  registerClient(data: { name: string; email: string; password: string; phone: string; address: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/clients/register`, data);
  }

  loginClient(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/clients/login`, { email, password });
  }
}
