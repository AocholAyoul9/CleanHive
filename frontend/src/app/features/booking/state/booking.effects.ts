import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { BookingApiService } from '../services/booking.api';
import * as BookingActions from './booking.actions';
import { catchError, from, map, mergeMap, of } from 'rxjs';
import { Booking } from '../models/booking.model';
import * as ClientActions from '../../client/state/client.actions';

@Injectable()
export class BookingEffects {
  createBooking$;
  loadBookings$;

  constructor(private actions$: Actions, private api: BookingApiService) {
    this.createBooking$ = createEffect(() =>
      this.actions$.pipe(
        ofType(BookingActions.createBooking),
        mergeMap(({ companyId, booking }) =>
          this.api.createBooking(companyId, booking).pipe(
            mergeMap((response: any) => {
              const fullBooking: Booking = {
                ...response,
                startTime: response.startTime,
                endTime: response.endTime,
              };

              return from([
                BookingActions.createBookingSuccess({ booking: fullBooking }),
                ClientActions.loadClientReservations(),
              ]);
            }),
            catchError((error) =>
              of(BookingActions.createBookingFailure({ error }))
            )
          )
        )
      )
    );

    this.loadBookings$ = createEffect(() =>
      this.actions$.pipe(
        ofType(BookingActions.loadCompanyBookings),
        mergeMap(({ companyId }) =>
          this.api.getCompanyBookings(companyId).pipe(
            map((bookings) => {
              console.log('Loaded bookings for companyId:', companyId, 'Bookings:', bookings);
              return BookingActions.loadCompanyBookingsSuccess({ bookings });
            }),
            catchError((error) =>
              of(BookingActions.loadCompanyBookingsFailure({ error }))
            )
          )
        )
      )
    );
  }
}
