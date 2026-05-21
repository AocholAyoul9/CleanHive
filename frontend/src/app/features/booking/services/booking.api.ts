import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking, CreateBookingRequest } from '../models/booking.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BookingApiService {
 
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createBooking(companyId: string, booking: CreateBookingRequest): Observable<Booking> {
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
}
