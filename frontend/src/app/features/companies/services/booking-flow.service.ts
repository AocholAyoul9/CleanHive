import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { CompaniesApiService } from './companies.api';

export type BookingFlowErrorCode = 'booking_failed' | 'auth_failed';

export class BookingFlowError extends Error {
  constructor(
    message: string,
    public code: BookingFlowErrorCode,
    public status?: unknown,
    override cause?: unknown,
  ) {
    super(message);
  }
}

@Injectable({ providedIn: 'root' })
export class BookingFlowService {
  constructor(private api: CompaniesApiService) {}


  createBookingWithClient(
    companyId: string,
    booking: { serviceId: string; startTime: string; address: string; price?: number },
  ): Observable<void> {
    return this.api.CreateBooking(companyId, booking).pipe(
      map(() => void 0),
      catchError((err) => this.toBookingFailedError(err)),
    );
  }

  private toBookingFailedError(err: unknown): Observable<never> {
    return throwError(
      () =>
        new BookingFlowError(
          'Erreur lors de la réservation. Veuillez réessayer.',
          'booking_failed',
          (err as any)?.status,
          err,
        ),
    );
  }
}
