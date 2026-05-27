import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, tap } from 'rxjs/operators';
import * as ClientActions from './client.actions';
import { ApiService } from '../../../core/api.service';
import {
  NearbyCompany,
} from '../models/client.model';
import { Booking } from '../../booking/models/booking.model';

@Injectable()
export class ClientEffects {
  loadClientReservations$: any;
  loadNearbyCompanies$: any;
  searchCompanies$: any;
  updateReservationStatus$: any;
  addReservationReview$: any;
  toggleFavoriteCompany$: any;
  loadClientProfileAfterLogin$: any;
  loadClientProfile$: any;
  
  constructor(
    private actions$: Actions,
    private api: ApiService
  ) {
    this.loadClientProfileAfterLogin$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ClientActions.loginClientSuccess),
        map(() => ClientActions.loadClientProfile())
      )
    );

    this.loadClientProfile$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ClientActions.loadClientProfile),
        mergeMap(() =>
          this.api.getClientProfile().pipe(
            tap((profile: any) => {
              console.log('Client profile response:', profile);
            }),
            map((profile: any) =>
              ClientActions.loadClientProfileSuccess({ profile })
            ),
            catchError((error: any) =>
              of(
                ClientActions.loadClientProfileFailure({ error: error.message })
              )
            )
          )
        )
      )
    );

    // Load client reservations
    this.loadClientReservations$ = createEffect(() =>
      this.actions$.pipe(
        ofType(ClientActions.loadClientReservations),
        mergeMap(() => {
          return this.api.getClientReservations().pipe(
<<<<<<< HEAD
            map((reservations: Booking[]) =>
              ClientActions.loadClientReservationsSuccess({ reservations })
            ),
=======
            map((reservations: Booking[]) => {
              console.log('Reservations API response', reservations);
              return ClientActions.loadClientReservationsSuccess({ reservations });
            }),
>>>>>>> 37677ad (feat: Enhance security and client features)
            catchError((error: any) =>
              of(
                ClientActions.loadClientReservationsFailure({
                  error: error.message,
                })
              )
            )
          );
        })
      )
    );
  }
}
