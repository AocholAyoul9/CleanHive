import { createAction, props } from '@ngrx/store';
import { 
  NearbyCompany, 
  ClientProfile 
} from '../models/client.model';
import { Booking } from '../../booking/models/booking.model';

// Load client profile
export const loadClientProfile = createAction('[Client] Load Client Profile');
export const loadClientProfileSuccess = createAction(
  '[Client] Load Client Profile Success',
  props<{ profile: ClientProfile }>()
);
export const loadClientProfileFailure = createAction(
  '[Client] Load Client Profile Failure',
  props<{ error: string }>()
);

export const registerClient = createAction('[Client] Register Client', props<{name: string; email: string; password: string; phone: string; address: string}>());
export const registerClientSuccess = createAction('[Client] Register Client Success', props<{clientId: string}>());
export const registerClientFailure = createAction('[Client] Register Client Failure', props<{error: any}>());

export const loginClient = createAction('[Client] Login Client', props<{email: string; password: string}>());
export const loginClientSuccess = createAction('[Client] Login Client Success', props<{clientId: string}>());
export const loginClientFailure = createAction('[Client] Login Client Failure', props<{error: any}>());

export const setAddress = createAction('[Client] Set Address', props<{address: string; lat: number; lng: number}>());


// Load client reservations
export const loadClientReservations = createAction(
  '[Client] Load Reservations',
  props<{ clientId?: string }>()
);
export const loadClientReservationsSuccess = createAction(
  '[Client] Load Reservations Success',
  props<{ reservations: Booking[] }>()
);

export const loadClientReservationsFailure = createAction(
  '[Client] Load Reservations Failure',
  props<{ error: string }>()
);

// Load nearby companies
export const loadNearbyCompanies = createAction(
  '[Client] Load Nearby Companies',
  props<{ location?: { lat: number; lng: number } }>()
);
export const loadNearbyCompaniesSuccess = createAction(
  '[Client] Load Nearby Companies Success',
  props<{ companies: NearbyCompany[] }>()
);

export const loadNearbyCompaniesFailure = createAction(
  '[Client] Load Nearby Companies Failure',
  props<{ error: string }>()
);
// Search companies by address
export const searchCompanies = createAction(
  '[Client] Search Companies',
  props<{ query: string }>()
);
export const searchCompaniesSuccess = createAction(
  '[Client] Search Companies Success',
  props<{ results: NearbyCompany[] }>()
);

export const searchCompaniesFailure = createAction(
  '[Client] Search Companies Failure',
  props<{ error: string }>()
);
export const clearSearchResults = createAction('[Client] Clear Search Results');

// Update reservation status
export const updateReservationStatus = createAction(
  '[Client] Update Reservation Status',
  props<{ reservationId: string; status: string; reason?: string }>()
);
export const updateReservationStatusSuccess = createAction(
  '[Client] Update Reservation Status Success',
  props<{ reservationId: string; status: string }>()
);

export const updateReservationStatusFailure = createAction(
  '[Client] Update Reservation Status Failure',
  props<{ error: string }>()
);
// Add review to reservation
export const addReservationReview = createAction(
  '[Client] Add Reservation Review',
  props<{ reservationId: string; rating: number; review: string }>()
);
export const addReservationReviewSuccess = createAction(
  '[Client] Add Reservation Review Success',
  props<{ reservationId: string; rating: number; review: string }>()
);

export const addReservationReviewFailure = createAction(
  '[Client] Add Reservation Review Failure',
  props<{ error: string }>()
);
// Toggle favorite company
export const toggleFavoriteCompany = createAction(
  '[Client] Toggle Favorite Company',
  props<{ companyId: string; isFavorite: boolean }>()
);
export const toggleFavoriteCompanySuccess = createAction(
  '[Client] Toggle Favorite Company Success',
  props<{ companyId: string; isFavorite: boolean }>()
);

// Select company and service
export const selectCompany = createAction(
  '[Client] Select Company',
  props<{ company: NearbyCompany }>()
);
export const selectService = createAction(
  '[Client] Select Service',
  props<{ service: any }>()
);
export const setBookingDate = createAction(
  '[Client] Set Booking Date',
  props<{ date: Date }>()
);
export const confirmBooking = createAction(
  '[Client] Confirm Booking',
  props<{ companyId: string; serviceId: string; date: string; time: string }>()
);
export const confirmBookingSuccess = createAction(
  '[Client] Confirm Booking Success',
  props<{ booking: Booking }>()
);
export const confirmBookingFailure = createAction(
  '[Client] Confirm Booking Failure',
  props<{ error: string }>()
);

// UI actions
export const setActiveTab = createAction(
  '[Client] Set Active Tab',
  props<{ tab: 'overview' | 'reservations' | 'companies' | 'history' }>()
);
export const setReservationFilter = createAction(
  '[Client] Set Reservation Filter',
  props<{ filter: 'all' | 'upcoming' | 'completed' | 'cancelled' }>()
);
export const setPaginationPage = createAction(
  '[Client] Set Pagination Page',
  props<{ page: number }>()
);