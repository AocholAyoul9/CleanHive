import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';

import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { provideStore, provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { companyFeature } from './features/companies/state/company.reducer';
import { bookingFeature } from './features/booking/state/booking.reducer';
import { CompanyEffects } from './features/companies/state/company.effects';
import { BookingEffects } from './features/booking/state/booking.effects';
import { authFeature } from './features/auth/state/auth.reducer';
import { AuthEffects } from './features/auth/state/auth.effects';
import { authInterceptor } from './features/auth/interceptors/auth.interceptor';
import { ClientEffects } from './features/client/state/client.effects';
import { clientReducer } from './features/client/state/client.reducer';
import { employeeReducer } from './features/employee/state/employee.reducer';
import { EmployeeEffects } from './features/employee/state/employee.effects';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    provideToastr({
      positionClass: 'toast-top-right',
      timeOut: 3000,
      progressBar: true,
      preventDuplicates: true,
    }),

    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),

    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },

    provideStore({
      client: clientReducer,
      employee: employeeReducer,
    }),
    provideState(companyFeature),
    provideState(authFeature),
    provideState(bookingFeature),
    provideEffects([CompanyEffects, BookingEffects, AuthEffects, ClientEffects , EmployeeEffects]),
  ],
};
