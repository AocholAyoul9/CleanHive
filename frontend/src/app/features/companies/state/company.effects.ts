import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { CompaniesApiService } from '../services/companies.api';
import * as CompanyActions from './company.actions';
import { NotificationService } from '../../../core/services/notification.service';

@Injectable()
export class CompanyEffects {
  private actions$ = inject(Actions);
  private notificationService = inject(NotificationService);

  loadCompanyEmployees$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompanyActions.loadCompanyEmployees),
      mergeMap(({ companyId }) =>
        this.api.getCompanyEmployees(companyId).pipe(
          map((employees) => CompanyActions.loadCompanyEmployeesSuccess({ employees })),
          catchError((error) => of(CompanyActions.loadCompanyEmployeesFailure({ error })))
        )
      )
    )
  );

  loadCompanyBookings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompanyActions.loadCompanyBookings),
      mergeMap(({ companyId }) =>
        this.api.getCompanyBookings(companyId).pipe(
          map((bookings) => CompanyActions.loadCompanyBookingsSuccess({ bookings })),
          catchError((error) => of(CompanyActions.loadCompanyBookingsFailure({ error })))
        )
      )
    )
  );

  loadCompanyServices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompanyActions.loadCompanyServices),
      mergeMap(() =>
        this.api.getCompanyService().pipe(
          map((services) => CompanyActions.loadCompanyServicesSuccess({ services })),
          catchError((error) => of(CompanyActions.loadCompanyServicesFailure({ error })))
        )
      )
    )
  );

  createCompanyService$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompanyActions.createCompanyService),
      mergeMap(({ services }) =>
        this.api.createCompanyService(services).pipe(
          map((createdService) => CompanyActions.createCompanyServiceSuccess({ services: createdService })),
          catchError((error) => of(CompanyActions.createCompanyServiceFailure({ error })))
        )
      )
    )
  );

  deleteCompanyService$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompanyActions.deleteCompanyService),
      mergeMap(({ serviceId }) =>
        this.api.deleteCompanyService(serviceId).pipe(
          map(() => CompanyActions.deleteCompanyServiceSuccess({ serviceId })),
          catchError((error) => of(CompanyActions.deleteCompanyServiceFailure({ error })))
        )
      )
    )
  );

  updateCompanyService$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompanyActions.updateCompanyService),
      mergeMap(({ serviceId, service }) =>
        this.api.updateCompanyService(serviceId, service).pipe(
          map((updatedService) => CompanyActions.updateCompanyServiceSuccess({ service: updatedService })),
          catchError((error) => of(CompanyActions.updateCompanyServiceFailure({ error })))
        )
      )
    )
  );

  loadCompany$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompanyActions.loadCompany),
      mergeMap(({ companyId }) =>
        this.api.getCompanyById(companyId).pipe(
          map((company) => CompanyActions.loadCompanySuccess({ company })),
          catchError((error) => of(CompanyActions.loadCompanyFailure({ error })))
        )
      )
    )
  );

  // Load services after company is loaded
  loadServicesOnCompanyLoad$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompanyActions.loadCompanySuccess),
      map(() => CompanyActions.loadCompanyServices())
    )
  );

  loadNearbyCompanies$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompanyActions.loadNearbyCompanies),
      mergeMap(({ lat, lng, radiusKm }) =>
        this.api.getNearByCompanies(lat, lng, radiusKm).pipe(
          map((companies) => CompanyActions.loadNearbyCompaniesSuccess({ companies })),
          catchError((error) => of(CompanyActions.loadNearbyCompaniesFailure({ error })))
        )
      )
    )
  );

  loadAllCompanies$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompanyActions.loadAllCompanies),
      mergeMap(() =>
        this.api.getCompanyAllCompanies().pipe(
          map((companies) => CompanyActions.loadAllCompaniesSuccess({ companies })),
          catchError((error) => of(CompanyActions.loadAllCompaniesFailure({ error: error.message })))
        )
      )
    )
  );

  addCompanyEmployee$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompanyActions.addCompanyEmployee),
      mergeMap(({ companyId, employeeData }) =>
        this.api.addCompanyEmployee(companyId, employeeData).pipe(
          map((employee) => CompanyActions.addCompanyEmployeeSuccess({ employee })),
          catchError((error) => of(CompanyActions.addCompanyEmployeeFailure({ error })))
        )
      )
    )
  );

  updateCompanyEmployee$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompanyActions.updateCompanyEmployee),
      mergeMap(({ companyId, employeeId, employeeData }) =>
        this.api.updateCompanyEmployee(companyId, employeeId, employeeData).pipe(
          map((employee) => CompanyActions.updateCompanyEmployeeSuccess({ employee })),
          catchError((error) => of(CompanyActions.updateCompanyEmployeeFailure({ error })))
        )
      )
    )
  );

  deleteCompanyEmployee$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CompanyActions.deleteCompanyEmployee),
      mergeMap(({ companyId, employeeId }) =>
        this.api.deleteCompanyEmployee(companyId, employeeId).pipe(
          map(() => CompanyActions.deleteCompanyEmployeeSuccess({ companyId, employeeId })),
          catchError((error) => of(CompanyActions.deleteCompanyEmployeeFailure({ error })))
        )
      )
    )
  );

  private api = inject(CompaniesApiService);

  companyCrudSuccessNotifications$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          CompanyActions.createCompanyServiceSuccess,
          CompanyActions.updateCompanyServiceSuccess,
          CompanyActions.deleteCompanyServiceSuccess,
          CompanyActions.addCompanyEmployeeSuccess,
          CompanyActions.updateCompanyEmployeeSuccess,
          CompanyActions.deleteCompanyEmployeeSuccess,
          CompanyActions.assignEmployeeToBookingSuccess,
        ),
        tap((action) => {
          const type = action.type;
          if (type.includes('create Company Services Success')) {
            this.notificationService.success('Service created successfully.');
          } else if (type.includes('update Company Services Success')) {
            this.notificationService.success('Service updated successfully.');
          } else if (type.includes('delete Company Services Success')) {
            this.notificationService.success('Service deleted successfully.');
          } else if (type.includes('Add Company Employee Success')) {
            this.notificationService.success('Employee created successfully.');
          } else if (type.includes('Update Company Employee Success')) {
            this.notificationService.success('Employee updated successfully.');
          } else if (type.includes('Delete Company Employee Success')) {
            this.notificationService.success('Employee deleted successfully.');
          } else {
            this.notificationService.success('Booking updated successfully.');
          }
        }),
      ),
    { dispatch: false },
  );

  companyCrudFailureNotifications$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          CompanyActions.createCompanyServiceFailure,
          CompanyActions.updateCompanyServiceFailure,
          CompanyActions.deleteCompanyServiceFailure,
          CompanyActions.addCompanyEmployeeFailure,
          CompanyActions.updateCompanyEmployeeFailure,
          CompanyActions.deleteCompanyEmployeeFailure,
          CompanyActions.assignEmployeeToBookingFailure,
        ),
        tap(({ error }) =>
          this.notificationService.error(
            error?.error?.message || error?.message || 'Request failed. Please try again.',
          ),
        ),
      ),
    { dispatch: false },
  );

  constructor() {}
}
