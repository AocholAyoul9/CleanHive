import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';

import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject, Subscription, debounceTime, takeUntil } from 'rxjs';

import { ClientProfile, NearbyCompany } from '../../../client/models/client.model';
import * as ClientSelectors from '../../../client/state/client.selectors';
import * as ClientActions from '../../../client/state/client.actions';

import { Booking } from '../../../booking/models/booking.model';
import { Company } from '../../../companies/models/company.model';
import {
  AddressSuggestion,
  LatLng,
  NearbyCompaniesService,
} from '../../../../shared/services/nearby-companies.service';
import { CompanyMapComponent } from '../../../../shared/components/company-map/company-map.component';
import { CompanyCardsComponent } from '../../../../shared/components/company-cards/company-cards.component';
import { BookingModalComponent } from '../../../../shared/components/booking-modal/booking-modal.component';

type TabType = 'overview' | 'reservations' | 'companies' | 'history';

interface DashboardTab {
  id: TabType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    CompanyMapComponent,
    CompanyCardsComponent,
    BookingModalComponent,
  ],
  templateUrl: './client-dashboard.component.html',
  styleUrls: ['./client-dashboard.component.scss'],
})
export class ClientDashboardComponent implements OnInit, OnDestroy {
  profile$: Observable<ClientProfile | null>;
  reservations$: Observable<Booking[]>;
  nearbyCompanies$: Observable<NearbyCompany[]>;
  displayedCompanies$: Observable<NearbyCompany[]>;
  loading$: Observable<boolean>;
  activeTab$: Observable<TabType>;
  hasSearchResults$: Observable<boolean>;
  searchQuery$: Observable<string>;

  dashboardCompanies$: Observable<Company[]>;

  activeReservations$: Observable<Booking[]>;
  historyReservations$: Observable<Booking[]>;
  completedReservations$: Observable<Booking[]>;
  cancelledReservations$: Observable<Booking[]>;

  dashboardStatsLocal$!: Observable<{
    upcoming: number;
    completed: number;
    cancelled: number;
    total: number;
    totalSpent: number;
  }>;

  tabs: DashboardTab[] = [
    { id: 'overview', label: "Vue d'ensemble", icon: 'fas fa-home' },
    { id: 'reservations', label: 'Mes Réservations', icon: 'fas fa-calendar-check' },
    { id: 'companies', label: 'Entreprises', icon: 'fas fa-store' },
    { id: 'history', label: 'Historique', icon: 'fas fa-history' },
  ];

  currentClient: { id: string } | null = null;

  searchForm: FormGroup;
  reviewForm: FormGroup;

  isReviewModalOpen = false;
  isCancelModalOpen = false;
  selectedReservation: Booking | null = null;

  bookingModalOpen = signal<boolean>(false);
  bookingCompany = signal<Company | null>(null);
  selectedDashboardCompany = signal<Company | null>(null);
  dashboardMapCenter = signal<LatLng>({ lat: 45.764, lng: 4.8357 });
  dashboardUserLocation = signal<LatLng | null>(null);
  geolocationLoading = signal<boolean>(false);

  companiesSearchQuery = '';
  companiesAddressSuggestions: AddressSuggestion[] = [];
  companiesRadius = 10;

  private subscriptions = new Subscription();
  private destroy$ = new Subject<void>();
  private dashboardSearchSubject = new Subject<string>();

  constructor(
    private store: Store,
    private fb: FormBuilder,
    private nearbyService: NearbyCompaniesService,
  ) {
    this.searchForm = this.fb.group({
      address: ['', Validators.required],
    });

    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      review: ['', Validators.maxLength(500)],
    });

    this.profile$ = this.store.select(ClientSelectors.selectClientProfile);
    this.reservations$ = this.store.select(ClientSelectors.selectReservations);
    this.nearbyCompanies$ = this.store.select(ClientSelectors.selectNearbyCompanies);
    this.displayedCompanies$ = this.store.select(ClientSelectors.selectDisplayedCompanies);
    this.loading$ = this.store.select(ClientSelectors.selectClientLoading);
    this.activeTab$ = this.store.select(ClientSelectors.selectActiveTab);
    this.hasSearchResults$ = this.store.select(ClientSelectors.selectHasSearchResults);
    this.searchQuery$ = this.store.select(ClientSelectors.selectSearchQuery);

    this.dashboardCompanies$ = this.displayedCompanies$.pipe(
      map((companies) => companies.map((company) => this.toCompanyModel(company))),
    );
    this.activeReservations$ = this.store.select(ClientSelectors.selectUpcomingReservations);
    this.historyReservations$ = this.store.select(ClientSelectors.selectHistoryReservations);
    this.completedReservations$ = this.store.select(ClientSelectors.selectCompletedReservations);
    this.cancelledReservations$ = this.store.select(ClientSelectors.selectCancelledReservations);
  }

  ngOnInit(): void {
    this.store.dispatch(ClientActions.loadClientProfile());
    this.store.dispatch(ClientActions.loadClientReservations({}));

    this.setupCompaniesSearchAutocomplete();
    this.loadNearbyUsingUserGeolocation();

    this.subscriptions.add(
      this.profile$.subscribe((profile) => {
        const typed = profile as { id?: string } | null;
        if (typed?.id) {
          this.currentClient = { id: typed.id };
        }
      }),
    );
    this.dashboardStatsLocal$ = this.reservations$.pipe(
      map((reservations) => {
        const upcoming = reservations.filter(
          (reservation) => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(reservation.status),
        ).length;

        const completed = reservations.filter((reservation) => reservation.status === 'COMPLETED').length;
        const cancelled = reservations.filter((reservation) => reservation.status === 'CANCELLED').length;

        const totalSpent = reservations
          .filter((reservation) => reservation.status === 'COMPLETED')
          .reduce((sum, reservation) => sum + (reservation.price || 0), 0);

        return {
          upcoming,
          completed,
          cancelled,
          total: reservations.length,
          totalSpent,
        };
      }),
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe();
  }

  setActiveTab(tab: TabType): void {
    this.store.dispatch(ClientActions.setActiveTab({ tab }));
  }

  setReservationFilter(
    filter: 'all' | 'upcoming' | 'completed' | 'cancelled',
  ): void {
    this.store.dispatch(ClientActions.setReservationFilter({ filter }));
  }

  onSearchAddress(): void {
    if (!this.searchForm.valid) return;

    const address = this.searchForm.get('address')?.value as string;
    this.companiesSearchQuery = address;
    this.searchFromAddress(address);
    this.setActiveTab('companies');
  }

  useCurrentLocation(): void {
    this.loadNearbyUsingUserGeolocation();
    this.searchForm.patchValue({ address: 'Ma position actuelle' });
    this.setActiveTab('companies');
  }

  clearSearch(): void {
    this.companiesSearchQuery = '';
    this.companiesAddressSuggestions = [];
    this.store.dispatch(ClientActions.clearSearchResults());
    this.searchForm.reset();
  }

  onCompaniesSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.companiesSearchQuery = query;
    this.dashboardSearchSubject.next(query);
  }

  async selectCompaniesAddressSuggestion(suggestion: AddressSuggestion): Promise<void> {
    this.companiesAddressSuggestions = [];
    const place = await this.nearbyService.getPlaceCoordinates(suggestion.place_id);
    if (!place) return;

    this.companiesSearchQuery = suggestion.description;
    this.searchForm.patchValue({ address: suggestion.description });
    this.dashboardMapCenter.set({ lat: place.lat, lng: place.lng });

    this.loadCompaniesAt(place.lat, place.lng, this.companiesRadius);
  }

  onCompaniesSearchEnter(): void {
    if (this.companiesAddressSuggestions.length > 0) {
      this.selectCompaniesAddressSuggestion(this.companiesAddressSuggestions[0]);
      return;
    }

    if (this.companiesSearchQuery.trim().length > 0) {
      this.searchFromAddress(this.companiesSearchQuery.trim());
    }
  }

  clearCompaniesSuggestions(): void {
    setTimeout(() => {
      this.companiesAddressSuggestions = [];
    }, 200);
  }

  async useDashboardLocation(): Promise<void> {
    await this.loadNearbyUsingUserGeolocation();
  }

  onDashboardRadiusChange(): void {
    const center = this.dashboardMapCenter();
    this.loadCompaniesAt(center.lat, center.lng, this.companiesRadius);
  }

  onDashboardCompanySelected(company: Company): void {
    this.selectedDashboardCompany.set(company);
  }

  openBookingModal(company: Company): void {
    this.bookingCompany.set(company);
    this.bookingModalOpen.set(true);
  }

  closeBookingModal(): void {
    this.bookingCompany.set(null);
    this.bookingModalOpen.set(false);
  }

  openReviewModal(reservation: Booking): void {
    this.selectedReservation = reservation;
    this.reviewForm.patchValue({
      rating: reservation.rating || 5,
      review: reservation.review || '',
    });
    this.isReviewModalOpen = true;
  }

  closeReviewModal(): void {
    this.isReviewModalOpen = false;
    this.selectedReservation = null;
    this.reviewForm.reset({ rating: 5, review: '' });
  }

  submitReview(): void {
    if (this.reviewForm.valid && this.selectedReservation) {
      const { rating, review } = this.reviewForm.value;
      this.store.dispatch(
        ClientActions.addReservationReview({
          reservationId: this.selectedReservation.id,
          rating,
          review,
        }),
      );
      this.closeReviewModal();
    }
  }

  openCancelModal(reservation: Booking): void {
    this.selectedReservation = reservation;
    this.isCancelModalOpen = true;
  }

  closeCancelModal(): void {
    this.isCancelModalOpen = false;
    this.selectedReservation = null;
  }

  cancelReservation(): void {
    if (!this.selectedReservation) return;

    this.store.dispatch(
      ClientActions.updateReservationStatus({
        reservationId: this.selectedReservation.id,
        status: 'CANCELLED',
      }),
    );
    this.closeCancelModal();
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente',
      CONFIRMED: 'Confirmée',
      IN_PROGRESS: 'En cours',
      COMPLETED: 'Terminée',
      CANCELLED: 'Annulée',
    };
    return labels[status] || status;
  }

  formatCurrency(amount = 0): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  canCancelReservation(reservation: Booking): boolean {
    return reservation.status === 'PENDING' || reservation.status === 'CONFIRMED';
  }

  canLeaveReview(reservation: Booking): boolean {
    return reservation.status === 'COMPLETED';
  }

  trackByReservationId(_index: number, reservation: Booking): string {
    return reservation.id;
  }

  getStatusClass(status: string): string {
    return status.toLowerCase();
  }

  private setupCompaniesSearchAutocomplete(): void {
    this.dashboardSearchSubject
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((query) => {
        this.nearbyService
          .getAutocompleteSuggestions(query)
          .then((suggestions) => {
            this.companiesAddressSuggestions = suggestions;
          })
          .catch(() => {
            this.companiesAddressSuggestions = [];
          });
      });
  }

  private async loadNearbyUsingUserGeolocation(): Promise<void> {
    this.geolocationLoading.set(true);

    try {
      const location = await this.nearbyService.getUserLocation();
      this.dashboardMapCenter.set(location);
      this.dashboardUserLocation.set(location);
      this.loadCompaniesAt(location.lat, location.lng, this.companiesRadius);

      const address = await this.nearbyService.reverseGeocode(location.lat, location.lng);
      if (address) {
        this.searchForm.patchValue({ address });
        this.companiesSearchQuery = address;
      }
    } catch {
      const fallback = this.nearbyService.defaultCenter;
      this.dashboardMapCenter.set(fallback);
      this.loadCompaniesAt(fallback.lat, fallback.lng, this.companiesRadius);
    } finally {
      this.geolocationLoading.set(false);
    }
  }

  private searchFromAddress(address: string): void {
    this.nearbyService
      .getAutocompleteSuggestions(address)
      .then((suggestions) => {
        if (suggestions.length === 0) return;
        this.selectCompaniesAddressSuggestion(suggestions[0]);
      })
      .catch(() => {
        // no-op
      });
  }

  private loadCompaniesAt(lat: number, lng: number, radiusKm: number): void {
    this.nearbyService.loadNearbyCompanies(lat, lng, radiusKm).subscribe({
      next: (companies) => {
        const nearbyCompanies = companies.map((company) => this.toNearbyCompany(company));
        this.store.dispatch(ClientActions.loadNearbyCompaniesSuccess({ companies: nearbyCompanies }));
      },
      error: () => {
        this.store.dispatch(ClientActions.loadNearbyCompaniesFailure({ error: 'Unable to load companies' }));
      },
    });
  }

  private toNearbyCompany(company: Company): NearbyCompany {
    return {
      id: company.id,
      name: company.name,
      logoUrl: company.logoUrl,
      address: company.address ?? '',
      distance: company.distance ?? 0,
      rating: company.rating ?? 0,
      isFavorite: false,
      services: (company.services ?? []).map((service) => ({
        id: service.id ?? '',
        name: service.name,
        description: service.description,
        basePrice: service.basePrice,
        durationInMinutes: service.durationInMinutes,
      })),
      latitude: company.latitude,
      longitude: company.longitude,
      reviewsCount: company.reviewsCount,
      isAvailableNow: company.isAvailableNow,
    };
  }

  private toCompanyModel(company: NearbyCompany): Company {
    return {
      id: company.id,
      name: company.name,
      logoUrl: company.logoUrl,
      address: company.address,
      distance: company.distance,
      rating: company.rating,
      services: (company.services ?? []).map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        basePrice: service.basePrice ?? service.price,
        durationInMinutes: service.durationInMinutes ?? service.duration,
      })),
      latitude: company.latitude,
      longitude: company.longitude,
      reviewsCount: company.reviewsCount,
      isAvailableNow: company.isAvailableNow,
    };
  }
}
