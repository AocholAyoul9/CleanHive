// client.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ClientState } from './client.reducer';
import { Booking } from '../../booking/models/booking.model';
import { NearbyCompany } from '../models/client.model';

type TabType = 'overview' | 'reservations' | 'companies' | 'history';
type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const ACTIVE_RESERVATION_STATUSES: ReadonlyArray<ReservationStatus> = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'];
const COMPLETED_RESERVATION_STATUSES: ReadonlyArray<ReservationStatus> = ['COMPLETED'];
const CANCELLED_RESERVATION_STATUSES: ReadonlyArray<ReservationStatus> = ['CANCELLED'];
const HISTORY_RESERVATION_STATUSES: ReadonlyArray<ReservationStatus> = ['COMPLETED', 'CANCELLED'];


// Feature selector
export const selectClientState = createFeatureSelector<ClientState>('client');




export const selectReservations = createSelector(
  selectClientState,
  (state) => state.reservations
);


// Basic selectors
export const selectClientProfile = createSelector(
  selectClientState,
  (state) => state.profile
);

export const selectClientReservations = createSelector(
  selectClientState,
  (state) => state.reservations
);

export const selectNearbyCompanies = createSelector(
  selectClientState,
  (state) => state.nearbyCompanies
);

export const selectFavoriteCompanies = createSelector(
  selectClientState,
  (state) => state.favoriteCompanies
);



export const selectClientLoading = createSelector(
  selectClientState,
  (state) => state.loading
);

export const selectClientError = createSelector(
  selectClientState,
  (state) => state.error
);

export const selectSearchResults = createSelector(
  selectClientState,
  (state) => state.searchResults
);

export const selectSearchQuery = createSelector(
  selectClientState,
  (state) => state.searchQuery
);

export const selectActiveTab = createSelector(
  selectClientState,
  (state): TabType => (state.activeTab as TabType) || 'overview'
);

export const selectReservationFilter = createSelector(
  selectClientState,
  (state) => state.reservationFilter
);

export const selectPagination = createSelector(
  selectClientState,
  (state) => state.pagination
);

// 3️⃣ Derived selectors
export const selectUpcomingReservations = createSelector(
  selectClientReservations,
  (reservations: Booking[]) => {
    return [...reservations]
      .filter((reservation) => ACTIVE_RESERVATION_STATUSES.includes(reservation.status as ReservationStatus))
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }
);

export const selectCompletedReservations = createSelector(
  selectClientReservations,
  (reservations: Booking[]) =>
    [...reservations]
      .filter((reservation) => COMPLETED_RESERVATION_STATUSES.includes(reservation.status as ReservationStatus))
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
);

export const selectCancelledReservations = createSelector(
  selectClientReservations,
  (reservations: Booking[]) =>
    [...reservations]
      .filter((reservation) => CANCELLED_RESERVATION_STATUSES.includes(reservation.status as ReservationStatus))
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
);

export const selectHistoryReservations = createSelector(
  selectClientReservations,
  (reservations: Booking[]) =>
    [...reservations]
      .filter((reservation) => HISTORY_RESERVATION_STATUSES.includes(reservation.status as ReservationStatus))
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
);

export const selectRecentReservations = createSelector(
  selectClientReservations,
  (reservations: Booking[]) =>
    reservations
      .sort((a: Booking, b: Booking) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5)
);

export const selectFilteredReservations = createSelector(
  selectClientReservations,
  selectReservationFilter,
  (reservations: Booking[], filter: string) => {
    switch (filter) {
      case 'upcoming':
        return [...reservations]
          .filter((reservation) => ACTIVE_RESERVATION_STATUSES.includes(reservation.status as ReservationStatus))
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      case 'completed':
        return [...reservations]
          .filter((reservation) => COMPLETED_RESERVATION_STATUSES.includes(reservation.status as ReservationStatus))
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      case 'cancelled':
        return [...reservations]
          .filter((reservation) => CANCELLED_RESERVATION_STATUSES.includes(reservation.status as ReservationStatus))
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      default:
        return [...reservations].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    }
  }
);

export const selectPaginatedReservations = createSelector(
  selectFilteredReservations,
  selectPagination,
  (reservations: Booking[], pagination: { currentPage: number; itemsPerPage: number; totalItems: number }) => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return reservations.slice(startIndex, startIndex + pagination.itemsPerPage);
  }
);

export const selectTotalPages = createSelector(
  selectFilteredReservations,
  selectPagination,
  (reservations: Booking[], pagination: { currentPage: number; itemsPerPage: number; totalItems: number }) => Math.ceil(reservations.length / pagination.itemsPerPage)
);

export const selectDisplayedCompanies = createSelector(
  selectNearbyCompanies,
  selectSearchResults,
  selectSearchQuery,
  (nearbyCompanies: NearbyCompany[], searchResults: NearbyCompany[], searchQuery: string) => searchQuery ? searchResults : nearbyCompanies
);

export const selectHasSearchResults = createSelector(
  selectSearchQuery,
  (query: string) => query.length > 0
);

// Selector for the latest booking created
export const selectLatestBooking = createSelector(
  selectClientReservations,
  (reservations: Booking[]) => {
    if (!reservations || reservations.length === 0) return null;
    return reservations.reduce((latest: Booking, current: Booking) =>
      new Date(current.startTime) > new Date(latest.startTime) ? current : latest
    );
  }
);

// Selector to check if a booking is being created
export const selectIsCreatingBooking = selectClientLoading;

// Selector for booking-related errors
export const selectBookingError = selectClientError;
