import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { AuthApiService } from '../services/auth.api.service';
import * as AuthActions from './auth.actions';
import * as CompanyActions from '../../companies/state/company.actions';
import * as ClientActions from '../../client/state/client.actions';
import { AuthUser } from '../models/user.model';
import { setToken, setRefreshToken, clearTokens } from '../utils/token-storage';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authApiService = inject(AuthApiService);
  private router = inject(Router);

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
            console.log('Login response:', res);
            console.log('User created:', user);
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
      ofType(AuthActions.loginSuccess),
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
      ofType(AuthActions.loginSuccess),
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

  constructor() {}
}