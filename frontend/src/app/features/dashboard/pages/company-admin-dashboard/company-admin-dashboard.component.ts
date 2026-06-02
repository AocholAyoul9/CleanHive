import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, map, take, filter, tap } from 'rxjs';

import { Company } from '../../../companies/models/company.model';
import {
  ServiceModel,
  ServiceModel as ServiceResponseDto,
} from '../../../../shared/models/service.model';
import {
  Employee,
  EmployeeCreateModel,
  EmployeeUpdateModel,
} from '../../../employee/models/employee.model';

import * as CompanySelectors from '../../../companies/state/company.selectors';
import * as CompanyActions from '../../../companies/state/company.actions';
import * as BookingActions from '../../../booking/state/booking.actions';
import * as AuthSelectors from '../../../auth/state/auth.selectors';
import * as BookingSelectors from '../../../booking/state/booking.selectors';
import { Booking } from '../../../booking/models/booking.model';
import { NotificationService } from '../../../../core/services/notification.service';

type TabType = 'overview' | 'services' | 'bookings' | 'employees';

@Component({
  selector: 'app-company-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './company-admin-dashboard.component.html',
  styleUrls: ['./company-admin-dashboard.component.scss'],
})
export class CompanyAdminDashboardComponent implements OnInit {
  // ================= STORE =================
  company$: Observable<Company | null>;
  services$: Observable<ServiceResponseDto[]>;
  bookings$: Observable<Booking[]>;
  employees$: Observable<Employee[]>;
  loading$: Observable<boolean>;

  recentBookings$: Observable<Booking[]>;

  // ================= STATE =================
  activeTab: TabType = 'overview';
  companyId = '';

  tabs = [
    { id: 'overview', label: "Vue d'ensemble", icon: 'fas fa-chart-pie' },
    { id: 'services', label: 'Services', icon: 'fas fa-concierge-bell' },
    { id: 'bookings', label: 'Réservations', icon: 'fas fa-calendar-check' },
    { id: 'employees', label: 'Employés', icon: 'fas fa-users' },
  ];

  // ================= MODALS =================
  newService: ServiceModel = {
    id: '',
    name: '',
    description: '',
    basePrice: 0,
    durationInMinutes: 0,
  };

  editingService: ServiceModel | null = null;
  isServiceModalOpen = false;
  isEditServiceModalOpen = false;

  newEmployee: EmployeeCreateModel = {
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    companyId: '',
    role: 'cleaner',
  };

  editingEmployee: Employee | null = null;
  isEmployeeModalOpen = false;
  isEditEmployeeModalOpen = false;

  employeeRoles = [
    { value: 'cleaner', label: 'Agent de Nettoyage' },
    { value: 'supervisor', label: 'Superviseur' },
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Administrateur' },
  ];

  // ================= INIT =================
  ngOnInit(): void {
    this.initCompany();
    this.initBookings();
  }

  constructor(
    private store: Store,
    private notificationService: NotificationService,
  ) {
    // store bindings
    this.company$ = this.store.select(CompanySelectors.selectCurrentCompany);
    this.services$ = this.store.select(CompanySelectors.selectCompanyServices);
    this.bookings$ = this.store.select(BookingSelectors.selectBookings);
    this.employees$ = this.store.select(CompanySelectors.selectCompanyEmployees);
    this.loading$ = this.store.select(CompanySelectors.selectCompanyLoading);

    this.recentBookings$ = this.bookings$.pipe(
      map(b => (b ?? []).slice(0, 5))
    );
  }

  // ================= SAFE INIT =================
  private initCompany(): void {
    this.company$
      .pipe(
        take(1),
        tap(company => {
          if (company) {
            this.companyId = company.id;
          }
        })
      )
      .subscribe();

    if (!this.companyId) {
      this.store
        .select(AuthSelectors.selectCurrentUser)
        .pipe(
          take(1),
          filter(user => !!user),
          tap(user => {
            this.companyId = user!.id;

            this.store.dispatch(
              CompanyActions.loadCompany({ companyId: this.companyId })
            );
          })
        )
        .subscribe();
    }
  }

  private initBookings(): void {
    this.store
      .select(AuthSelectors.selectCurrentUser)
      .pipe(
        take(1),
        filter(user => !!user),
        tap(user => {
          this.store.dispatch(
            BookingActions.loadCompanyBookings({ companyId: user!.id })
          );
        })
      )
      .subscribe();
  }

  // ================= UI =================
  setActiveTab(tab: TabType): void {
    this.activeTab = tab;
  }

  getTotalRevenue(bookings: Booking[] | null): number {
    return (bookings ?? []).reduce(
      (total, b) => total + (b.price ?? 0),
      0
    );
  }

  // ================= SERVICES =================
  openServiceModal(): void {
    this.isServiceModalOpen = true;
  }

  closeServiceModal(): void {
    this.isServiceModalOpen = false;
  }

  createService(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.notificationService.error('Please complete all required service fields.');
      return;
    }

    this.store.dispatch(
      CompanyActions.createCompanyService({ services: this.newService })
    );
    this.closeServiceModal();
  }

  openEditServiceModal(service: ServiceModel): void {
    this.editingService = { ...service };
    this.isEditServiceModalOpen = true;
  }

  closeEditServiceModal(): void {
    this.isEditServiceModalOpen = false;
    this.editingService = null;
  }

  updateService(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.notificationService.error('Please complete all required service fields.');
      return;
    }

    if (!this.editingService?.id) return;

    this.store.dispatch(
      CompanyActions.updateCompanyService({
        serviceId: this.editingService.id,
        service: this.editingService,
      })
    );

    this.closeEditServiceModal();
  }

  deleteService(serviceId: string): void {
    this.store.dispatch(
      CompanyActions.deleteCompanyService({ serviceId })
    );
  }

  // ================= EMPLOYEES =================
  openEmployeeModal(): void {
    this.newEmployee.companyId = this.companyId;
    this.isEmployeeModalOpen = true;
  }

  closeEmployeeModal(): void {
    this.isEmployeeModalOpen = false;
  }

  createEmployee(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.notificationService.error('Please complete all required employee fields.');
      return;
    }

    if (!this.companyId) return;

    this.store.dispatch(
      CompanyActions.addCompanyEmployee({
        companyId: this.companyId,
        employeeData: this.newEmployee,
      })
    );

    this.closeEmployeeModal();
  }

  openEditEmployeeModal(employee: Employee): void {
    this.editingEmployee = { ...employee };
    this.isEditEmployeeModalOpen = true;
  }

  closeEditEmployeeModal(): void {
    this.isEditEmployeeModalOpen = false;
    this.editingEmployee = null;
  }

  updateEmployee(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.notificationService.error('Please complete all required employee fields.');
      return;
    }

    if (!this.editingEmployee?.id) return;

    this.store.dispatch(
      CompanyActions.updateCompanyEmployee({
        companyId: this.companyId,
        employeeId: this.editingEmployee.id,
        employeeData: this.editingEmployee,
      })
    );

    this.closeEditEmployeeModal();
  }

  deleteEmployee(employeeId: string): void {
    this.store.dispatch(
      CompanyActions.deleteCompanyEmployee({
        companyId: this.companyId,
        employeeId,
      })
    );
  }

  getRoleLabel(role: string | undefined): string {
    return (
      this.employeeRoles.find(r => r.value === role)?.label ||
      'Agent de Nettoyage'
    );
  }

  // ================= BOOKINGS =================
  assignEmployeeToBooking(bookingId: string, employeeId: string): void {
    if (!employeeId) return;

    this.store.dispatch(
      CompanyActions.assignEmployeeToBooking({
        companyId: this.companyId,
        bookingId,
        employeeId,
      })
    );
  }

  updateBookingStatus(bookingId: string, status: string): void {
    this.notificationService.info(`Booking ${bookingId} status update to ${status} is not implemented yet.`);
  }
}