import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { getClientId } from '../features/auth/utils/token-storage';
import { Booking } from '../features/booking/models/booking.model';
import { ClientProfile } from '../features/client/models/client.model';
import { EmployeeProfile, EmployeeTask ,EmployeeSchedule , EmployeeStats, EmployeeNotification} from '../features/employee/models/employee.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  
  private baseUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  /* private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();

    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }*/


  // ---------------- Client Reservations ----------------
  getClientReservations(clientId: string): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.baseUrl}/clients/reservations`, {
      headers: { clientId },
    });
  }

// ---------------- Client Profile ----------------
getClientProfile(): Observable<ClientProfile> {
  const clientId = getClientId();

  return this.http.get<ClientProfile>(`${this.baseUrl}/clients/profile`, {
    headers: new HttpHeaders({
      clientId: clientId
    })
  });
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

//employee Dashboard
// ------------ Méthodes Employé ---------------

private getEmployeeHeaders(): HttpHeaders {
  const employeeId = localStorage.getItem('employeeId');

  return new HttpHeaders({
    'Content-Type': 'application/json',
    employeeId: employeeId ?? ''
  });
}


  // 1. Get employee profile for dashboard
  getEmployeeProfile(): Observable<EmployeeProfile> {
    return this.http.get<EmployeeProfile>(`${this.baseUrl}/companies/employees/profile`, {
      headers: this.getEmployeeHeaders()
    });
  }

  // 2. Update employee profile
  updateEmployeeProfile(profile: Partial<EmployeeProfile>): Observable<EmployeeProfile> {
    return this.http.patch<EmployeeProfile>(`${this.baseUrl}/companies/employees/profile`, profile, {
      headers: this.getEmployeeHeaders()
    });
  }

  // 3. Get employee tasks (with filtering)
  getEmployeeTasks(
    status?: string,
    date?: string,
    priority?: string
  ): Observable<EmployeeTask[]> {
    let params: any = {};
    if (status) params.status = status;
    if (date) params.date = date;
    if (priority) params.priority = priority;

    return this.http.get<EmployeeTask[]>(`${this.baseUrl}/companies/employees/tasks`, {
      headers: this.getEmployeeHeaders(),
      params
    });
  }

  // 4. Get today's tasks
  getEmployeeTodayTasks(): Observable<EmployeeTask[]> {
    return this.http.get<EmployeeTask[]>(`${this.baseUrl}/companies/employees/tasks/today`, {
      headers: this.getEmployeeHeaders()
    });
  }

  // 5. Get upcoming tasks (next 7 days)
  getEmployeeUpcomingTasks(): Observable<EmployeeTask[]> {
    return this.http.get<EmployeeTask[]>(`${this.baseUrl}/companies/employees/tasks/upcoming`, {
      headers: this.getEmployeeHeaders()
    });
  }

  // 6. Get completed tasks
  getEmployeeCompletedTasks(days: number = 30): Observable<EmployeeTask[]> {
    return this.http.get<EmployeeTask[]>(`${this.baseUrl}/companies/employees/tasks/completed`, {
      headers: this.getEmployeeHeaders(),
      params: { days: days.toString() }
    });
  }

  // 7. Update task status
  updateEmployeeTaskStatus(
    taskId: string,
    status: string,
    data?: { startTime?: string; endTime?: string; notes?: string }
  ): Observable<EmployeeTask> {
    return this.http.patch<EmployeeTask>(
      `${this.baseUrl}/companies/employees/tasks/${taskId}/status`,
      { status, ...data },
      { headers: this.getEmployeeHeaders() }
    );
  }

  // 8. Get task details
  getEmployeeTaskDetails(taskId: string): Observable<EmployeeTask> {
    return this.http.get<EmployeeTask>(`${this.baseUrl}/companies/employees/tasks/${taskId}`, {
      headers: this.getEmployeeHeaders()
    });
  }

  // 9. Get notifications
  getEmployeeNotifications(unreadOnly: boolean = false): Observable<EmployeeNotification[]> {
    return this.http.get<EmployeeNotification[]>(`${this.baseUrl}/companies/employees/notifications`, {
      headers: this.getEmployeeHeaders(),
      params: { unreadOnly: unreadOnly.toString() }
    });
  }

  // 10. Mark notification as read
  markEmployeeNotificationAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/companies/employees/notifications/${notificationId}/read`,
      {},
      { headers: this.getEmployeeHeaders() }
    );
  }

  // 11. Mark all notifications as read
  markAllEmployeeNotificationsAsRead(): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/companies/employees/notifications/mark-all-read`,
      {},
      { headers: this.getEmployeeHeaders() }
    );
  }

  // 12. Clear all notifications
  clearAllEmployeeNotifications(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/companies/employees/notifications`, {
      headers: this.getEmployeeHeaders()
    });
  }

  // 13. Get employee statistics
  getEmployeeStats(period: string = 'monthly'): Observable<EmployeeStats> {
    return this.http.get<EmployeeStats>(`${this.baseUrl}/companies/employees/stats`, {
      headers: this.getEmployeeHeaders(),
      params: { period }
    });
  }

  // 14. Get employee schedule
  getEmployeeSchedule(
    startDate?: string,
    endDate?: string
  ): Observable<EmployeeSchedule[]> {
    let params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.http.get<EmployeeSchedule[]>(`${this.baseUrl}/companies/employees/schedule`, {
      headers: this.getEmployeeHeaders(),
      params
    });
  }

  // 15. Update availability status
  updateEmployeeAvailability(isAvailable: boolean): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/companies/employees/availability`,
      { isAvailable },
      { headers: this.getEmployeeHeaders() }
    );
  }


}
