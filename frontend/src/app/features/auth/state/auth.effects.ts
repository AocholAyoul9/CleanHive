import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { ROOT_EFFECTS_INIT } from '@ngrx/effects';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { AuthApiService } from '../services/auth.api.service';
import * as AuthActions from './auth.actions';
import * as CompanyActions from '../../companies/state/company.actions';
import * as ClientActions from '../../client/state/client.actions';
import { AuthUser } from '../models/user.model';
import { NotificationService } from '../../../core/services/notification.service';
import { clearTokens, getRefreshToken, getToken, setRefreshToken, setToken } from '../utils/token-storage';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authApiService = inject(AuthApiService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  restoreSessionOnInit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      map(() => AuthActions.restoreSession())
    )
  );

  restoreSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.restoreSession),
      map(() => {
        const token = getToken();
        const userType = this.getStoredUserType();
        if (!token || !userType) {
          return AuthActions.restoreSessionFailure({ error: 'No stored session found' });
        }

        const storedUser = this.getStoredUser(userType);
        const user: AuthUser = {
          id: storedUser?.id ?? storedUser?.companyId ?? '',
          name: storedUser?.name ?? storedUser?.username ?? '',
          email: storedUser?.email ?? '',
          role: userType,
        };

        return AuthActions.restoreSessionSuccess({
          user,
          accessToken: token,
          refreshToken: getRefreshToken(),
          userType,
        });
      }),
      catchError((error) =>
        of(
          AuthActions.restoreSessionFailure({
            error: error?.message ?? 'Failed to restore session',
          })
        )
      )
    )
  );

  // ----------------------
  // LOGIN EFFECT
  // ----------------------
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      mergeMap(({ email, password, userType }) =>
        this.authApiService.login(email, password, userType).pipe(
          tap((res) => {
            setToken(res.token);
            if (res.refreshToken) setRefreshToken(res.refreshToken);
            localStorage.setItem(userType, JSON.stringify(res));
          }),
          map((res) => {
            const userId = userType === 'company' 
              ? (res.companyId ?? res.id ?? '')
              : (res.id ?? '');
            const user: AuthUser = {
              id: userId,
              name: res.name ?? res.username ?? '',
              email: res.email ?? '',
              role: userType,
            };
            return AuthActions.loginSuccess({ user, accessToken: res.token ?? res.accessToken, userType });
          }),
          catchError((error) =>
            of(
              AuthActions.loginFailure({
                error: error?.error?.message ?? error.message ?? 'Login failed',
              })
            )
          )
        )
      )
    )
  );

  // ----------------------
  // LOGIN SUCCESS NAVIGATION
  // ----------------------
  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ userType }) => {
          this.notificationService.success('Login successful.');
          const routeMap: Record<string, string> = {
            client: '/client-dashboard',
            company: '/company-admin-dashboard',
            employee: '/employee-dashboard',
          };
          // Store user type for client reservations
          if (userType === 'client') {
            localStorage.setItem('userType', userType);
          }
          this.router.navigate([routeMap[userType] ?? '/']);
        })
      ),
    { dispatch: false }
  );

  // Load client reservations after client login
  loadClientReservationsOnLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess, AuthActions.restoreSessionSuccess),
      mergeMap(({ userType }) => {
        if (userType === 'client') {
          return of(
            ClientActions.loadClientReservations()
          );
        }
        return of();
      })
    )
  );

  // ----------------------
  // REGISTER EFFECT
  // ----------------------

  register$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AuthActions.register),
    mergeMap(({ userData, userType }) =>
      this.authApiService.register(userData, userType).pipe(
        tap((res) => {
          setToken(res.token);
          if (res.refreshToken) {
            setRefreshToken(res.refreshToken);
          }
        }),
        map((res) => {
          const user: AuthUser = {
            id: res.id ?? '',
            name: res.name ?? res.username ?? '',
            email: res.email ?? '',
            role: userType,
          };
          this.notificationService.success('Registration successful.');

          return AuthActions.loginSuccess({
            user,
            accessToken: res.token,
            userType,
          });
        }),
        catchError((error) =>
          of(
            AuthActions.registerFailure({
              error: error?.error?.message ?? 'Registration failed',
            })
          )
        )
      )
    )
  )
);


  registerSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.registerSuccess),
        tap(({ userType }) => {
          const routeMap: Record<string, string> = {
            client: '/client-dashboard',
            company: '/company-admin-dashboard',
            employee: '/employee-dashboard',
          };
          this.router.navigate([routeMap[userType] ?? '/']);
        })
      ),
    { dispatch: false }
  );
  // ----------------------
  // LOGOUT EFFECT
  // ----------------------
  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          clearTokens();
          this.router.navigate(['/']);
        })
      ),
    { dispatch: false }
  );

  // ----------------------
  // LOGIN SUCCESS - LOAD COMPANY DATA
  // ----------------------
  loadCompanyDataOnLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess, AuthActions.restoreSessionSuccess),
      mergeMap(({ user, userType }) => {
        if (userType === 'company') {
          return of(
            CompanyActions.loadCompany({ companyId: user.id }),
            CompanyActions.loadCompanyServices(),
            CompanyActions.loadCompanyEmployees({ companyId: user.id })
          );
        }
        return of();
      })
    )
  );

  // ----------------------
  // REFRESH TOKEN
  // ----------------------
  refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      mergeMap(({ token }) =>
        this.authApiService.refreshToken(token).pipe(
          tap((res) => setToken(res.accessToken ?? res.token)),
          map((res) =>
            AuthActions.refreshTokenSuccess({ accessToken: res.accessToken ?? res.token })
          ),
          catchError((error) =>
            of(
              AuthActions.refreshTokenFailure({
                error: error?.error?.message ?? error.message ?? 'Token refresh failed',
              })
            )
          )
        )
      )
    )
  );

  authFailureNotifications$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          AuthActions.loginFailure,
          AuthActions.registerFailure,
          AuthActions.refreshTokenFailure,
        ),
        tap(({ error }) => this.notificationService.error(error || 'Authentication failed.')),
      ),
    { dispatch: false },
  );
  private getStoredUserType(): 'client' | 'company' | 'employee' | null {
    if (typeof window === 'undefined') return null;
    const explicitUserType = localStorage.getItem('userType');
    if (
      explicitUserType === 'client' ||
      explicitUserType === 'company' ||
      explicitUserType === 'employee'
    ) {
      return explicitUserType;
    }

    if (localStorage.getItem('client')) return 'client';
    if (localStorage.getItem('company')) return 'company';
    if (localStorage.getItem('employee')) return 'employee';
    return null;
  }

  private getStoredUser(userType: 'client' | 'company' | 'employee'): any {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(userType);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  constructor() {}
}