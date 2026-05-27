import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import { CompaniesApiService } from './companies.api';
import { CreateBookingRequest } from '../../booking/models/booking.model';

export type BookingFlowErrorCode = 'booking_failed' | 'auth_failed';

export class BookingFlowError extends Error {
  constructor(
    message: string,
    public code: BookingFlowErrorCode,
    override cause?: unknown,
  ) {
    super(message);
  }
}

export interface BookingFlowClientInput {
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

@Injectable({ providedIn: 'root' })
export class BookingFlowService {
  constructor(private api: CompaniesApiService) {}

/**
    * Mirrors NearbyCompanies booking behavior:
    * - use existing localStorage clientId when present
    * - otherwise register client (TempPass123!), if register fails then try login fallback
    * - persist clientId in localStorage on success
    */
  createBookingWithClient(
    companyId: string,
    booking: { serviceId: string; startTime: string; address: string; price?: number },
    client: BookingFlowClientInput,
  ): Observable<void> {
    const existingId = this.getStoredClientId();
    if (existingId) {
      return this.api.CreateBooking(companyId, { ...booking }).pipe(
        map(() => void 0),
        catchError((err) => {
          if (!this.isClientNotFoundError(err)) {
            return this.toBookingFailedError(err);
          }

          localStorage.removeItem('clientId');
          return this.registerOrLoginAndCreateBooking(companyId, booking, client);
        }),
      );
    }

    return this.registerOrLoginAndCreateBooking(companyId, booking, client);
  }

  private registerOrLoginAndCreateBooking(
    companyId: string,
    booking: { serviceId: string; startTime: string; address: string; price?: number },
    client: BookingFlowClientInput,
  ): Observable<void> {
    const tempPassword = 'TempPass123!';

    return this.api
      .registerClient({
        name: client.fullName,
        email: client.email,
        password: tempPassword,
        phone: client.phone,
        address: client.address,
      })
      .pipe(
        switchMap((res) => {
          const id = res?.id as string | undefined;
          if (!id) {
            return throwError(
              () =>
                new BookingFlowError(
                  "Erreur d'authentification. Veuillez réessayer.",
                  'auth_failed',
                  res,
                ),
            );
          }

          localStorage.setItem('clientId', id);
          return this.api.CreateBooking(companyId, { ...booking }).pipe(map(() => void 0));
        }),
        catchError((registerErr) => {
          return this.api.loginClient(client.email, tempPassword).pipe(
            switchMap((loginRes) => {
              const id = loginRes?.id as string | undefined;
              if (!id) {
                return throwError(
                  () =>
                    new BookingFlowError(
                      "Erreur d'authentification. Veuillez réessayer.",
                      'auth_failed',
                      loginRes,
                    ),
                );
              }
              localStorage.setItem('clientId', id);
              return this.api.CreateBooking(companyId, { ...booking }).pipe(map(() => void 0));
            }),
            catchError((loginErr) =>
              throwError(
                () =>
                  new BookingFlowError(
                    "Erreur d'authentification. Veuillez réessayer.",
                    'auth_failed',
                    { registerErr, loginErr },
                  ),
              ),
            ),
          );
        }),
        catchError((err) => {
          if (err instanceof BookingFlowError) return throwError(() => err);
          return this.toBookingFailedError(err);
        }),
      );
  }

  private toBookingFailedError(err: unknown): Observable<never> {
    return throwError(
      () =>
        new BookingFlowError(
          'Erreur lors de la réservation. Veuillez réessayer.',
          'booking_failed',
          err,
        ),
    );
  }

  private isClientNotFoundError(err: unknown): boolean {
    const message = (err as any)?.error?.message;
    return typeof message === 'string' && message.toLowerCase().includes('client not found');
  }

  private getStoredClientId(): string | null {
    const directClientId = localStorage.getItem('clientId');
    if (this.isUuid(directClientId)) return directClientId;

    const clientRaw = localStorage.getItem('client');
    if (!clientRaw) return null;

    try {
      const parsedId = JSON.parse(clientRaw)?.id;
      if (this.isUuid(parsedId)) {
        localStorage.setItem('clientId', parsedId);
        return parsedId;
      }
    } catch {
      return null;
    }

    return null;
  }

  private isUuid(value: unknown): value is string {
    return (
      typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    );
  }
}
