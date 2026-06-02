import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Booking } from '../features/booking/models/booking.model';
import { ClientProfile } from '../features/client/models/client.model';
import { EmployeeProfile, EmployeeTask, EmployeeSchedule, EmployeeStats, EmployeeNotification } from '../features/employee/models/employee.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ---------------- Client Reservations (JWT authenticated) ----------------
  getClientReservations(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/clients/reservations`);
  }

  // ---------------- Client Profile (JWT authenticated) ----------------
  getClientProfile(): Observable<ClientProfile> {
    return this.http.get<ClientProfile>(`${this.baseUrl}/clients/profile`);
  }

  // ---------------- Update Reservation Status ----------------
  updateReservationStatus(reservationId: string, status: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/clients/reservations/${reservationId}/status`, { status });
  }

  // ---------------- Add Review ----------------
  addReservationReview(reservationId: string, rating: number, review: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/clients/reservations/${reservationId}/review`, { rating, review });
  }

  // ---------------- Update Favorite Company ----------------
  updateFavoriteCompany(companyId: string, isFavorite: boolean): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/clients/companies/${companyId}/favorite`, { isFavorite });
  }

  // ---------------- Employee Methods (JWT authenticated) ----------------

  getEmployeeProfile(): Observable<EmployeeProfile> {
    return this.http.get<EmployeeProfile>(`${this.baseUrl}/companies/employees/profile`);
  }

  updateEmployeeProfile(profile: Partial<EmployeeProfile>): Observable<EmployeeProfile> {
    return this.http.patch<EmployeeProfile>(`${this.baseUrl}/companies/employees/profile`, profile);
  }

  getEmployeeTasks(
    status?: string,
    date?: string,
    priority?: string
  ): Observable<EmployeeTask[]> {
    let params: any = {};
    if (status) params.status = status;
    if (date) params.date = date;
    if (priority) params.priority = priority;

    return this.http.get<EmployeeTask[]>(`${this.baseUrl}/companies/employees/tasks`, { params });
  }

  getEmployeeTodayTasks(): Observable<EmployeeTask[]> {
    return this.http.get<EmployeeTask[]>(`${this.baseUrl}/companies/employees/tasks/today`);
  }

  getEmployeeUpcomingTasks(): Observable<EmployeeTask[]> {
    return this.http.get<EmployeeTask[]>(`${this.baseUrl}/companies/employees/tasks/upcoming`);
  }

  getEmployeeCompletedTasks(days: number = 30): Observable<EmployeeTask[]> {
    return this.http.get<EmployeeTask[]>(`${this.baseUrl}/companies/employees/tasks/completed`, {
      params: { days: days.toString() }
    });
  }

  updateEmployeeTaskStatus(
    taskId: string,
    status: string,
    data?: { startTime?: string; endTime?: string; notes?: string }
  ): Observable<EmployeeTask> {
    return this.http.patch<EmployeeTask>(
      `${this.baseUrl}/companies/employees/tasks/${taskId}/status`,
      { status, ...data }
    );
  }

  getEmployeeTaskDetails(taskId: string): Observable<EmployeeTask> {
    return this.http.get<EmployeeTask>(`${this.baseUrl}/companies/employees/tasks/${taskId}`);
  }

  getEmployeeNotifications(unreadOnly: boolean = false): Observable<EmployeeNotification[]> {
    return this.http.get<EmployeeNotification[]>(`${this.baseUrl}/companies/employees/notifications`, {
      params: { unreadOnly: unreadOnly.toString() }
    });
  }

  markEmployeeNotificationAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/companies/employees/notifications/${notificationId}/read`,
      {}
    );
  }

  markAllEmployeeNotificationsAsRead(): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/companies/employees/notifications/mark-all-read`,
      {}
    );
  }

  clearAllEmployeeNotifications(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/companies/employees/notifications`);
  }

  getEmployeeStats(period: string = 'monthly'): Observable<EmployeeStats> {
    return this.http.get<EmployeeStats>(`${this.baseUrl}/companies/employees/stats`, {
      params: { period }
    });
  }

  getEmployeeSchedule(
    startDate?: string,
    endDate?: string
  ): Observable<EmployeeSchedule[]> {
    let params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.http.get<EmployeeSchedule[]>(`${this.baseUrl}/companies/employees/schedule`, { params });
  }

  updateEmployeeAvailability(isAvailable: boolean): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/companies/employees/availability`,
      { isAvailable }
    );
  }
}