import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule as NgFormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';

import { Company } from '../../models/company.model';
import {
  AddressSuggestion,
  LatLng,
  NearbyCompaniesService,
} from '../../../../shared/services/nearby-companies.service';
import { CompanyMapComponent } from '../../../../shared/components/company-map/company-map.component';
import { CompanyCardsComponent } from '../../../../shared/components/company-cards/company-cards.component';
import { BookingModalComponent } from '../../../../shared/components/booking-modal/booking-modal.component';

type SortMode = 'distance' | 'rating' | 'available';

@Component({
  selector: 'app-nearby-companies',
  standalone: true,
  imports: [
    CommonModule,
    NgFormsModule,
    CompanyMapComponent,
    CompanyCardsComponent,
    BookingModalComponent,
  ],
  templateUrl: './nearby-companies.component.html',
  styleUrls: ['./nearby-companies.component.scss'],
})
export class NearbyCompaniesComponent implements OnInit, OnDestroy {
  private nearbyService = inject(NearbyCompaniesService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();


  searchQuery = '';
  searchFocused = false;
  sortBy: SortMode = 'distance';
  activeFilter: string | null = null;
  currentRadius = 10;

  selectedCompany = signal<Company | null>(null);
  mapCenter = signal<LatLng>(this.nearbyService.defaultCenter);
  userLocation = signal<LatLng | null>(null);
  sheetOpen = signal<boolean>(false);
  loading = signal<boolean>(false);
  geolocationLoading = signal<boolean>(false);

  bookingModalOpen = signal<boolean>(false);
  bookingCompany = signal<Company | null>(null);

  currentCompanies: Company[] = [];
  addressSuggestions: AddressSuggestion[] = [];

  get sortedCompanies(): Company[] {
    const list = [...this.currentCompanies];
    switch (this.sortBy) {
      case 'rating':
        return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case 'available':
        return list.sort(
          (a, b) => Number(b.isAvailableNow !== false) - Number(a.isAvailableNow !== false),
        );
      default:
        return list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }
  }

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.loadInitialCompanies();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  onSearchFocus(): void {
    if (this.searchQuery.length >= 3) {
      this.searchSubject.next(this.searchQuery);
    }
  }

  onSearchEnter(): void {
    if (this.addressSuggestions.length > 0) {
      this.selectAddressSuggestion(this.addressSuggestions[0]);
    }
  }

  clearSuggestions(): void {
    setTimeout(() => {
      this.addressSuggestions = [];
    }, 200);
  }

  async selectAddressSuggestion(suggestion: AddressSuggestion): Promise<void> {
    const place = await this.nearbyService.getPlaceCoordinates(suggestion.place_id);
    if (!place) return;

    this.mapCenter.set({ lat: place.lat, lng: place.lng });
    this.searchQuery = suggestion.description;
    this.addressSuggestions = [];
    this.loadCompaniesAround(place.lat, place.lng, this.currentRadius);
  }

  async useMyLocation(): Promise<void> {
    this.geolocationLoading.set(true);
    try {
      const location = await this.nearbyService.getUserLocation();
      this.userLocation.set(location);
      this.mapCenter.set(location);
      this.loadCompaniesAround(location.lat, location.lng, this.currentRadius);

      const address = await this.nearbyService.reverseGeocode(location.lat, location.lng);
      if (address) this.searchQuery = address;
    } catch {
      alert("Impossible d'obtenir votre position. Veuillez saisir votre adresse manuellement.");
    } finally {
      this.geolocationLoading.set(false);
    }
  }

  onRadiusChange(): void {
    const center = this.mapCenter();
    this.loadCompaniesAround(center.lat, center.lng, this.currentRadius);
  }

  setSortBy(mode: SortMode): void {
    this.sortBy = mode;
  }

  clearFilter(): void {
    this.activeFilter = null;
  }

  selectCompany(company: Company): void {
    this.selectedCompany.set(company);
  }

  onMapCompanySelected(company: Company): void {
    this.selectCompany(company);
  }

  toggleSheet(): void {
    this.sheetOpen.update((value) => !value);
  }

  closeSheet(): void {
    this.sheetOpen.set(false);
  }

  bookCompany(company: Company): void {
    this.bookingCompany.set(company);
    this.bookingModalOpen.set(true);
  }

  closeBookingModal(): void {
    this.bookingModalOpen.set(false);
    this.bookingCompany.set(null);
  }

  trackByCompanyId(_: number, company: Company): string {
    return company.id;
  }

  formatDistance(meters: number | undefined): string {
    return this.nearbyService.formatDistance(meters);
  }

  private setupSearchSubscription(): void {
    this.searchSubject
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((query) => {
        this.nearbyService
          .getAutocompleteSuggestions(query)
          .then((suggestions) => {
            this.addressSuggestions = suggestions;
          })
          .catch(() => {
            this.addressSuggestions = [];
          });
      });
  }

  private loadInitialCompanies(): void {
    this.nearbyService
      .getUserLocation()
      .then(async (location) => {
        this.userLocation.set(location);
        this.mapCenter.set(location);
        this.loadCompaniesAround(location.lat, location.lng, this.currentRadius);

        const address = await this.nearbyService.reverseGeocode(location.lat, location.lng);
        if (address) this.searchQuery = address;
      })
      .catch(() => {
        const fallback = this.nearbyService.defaultCenter;
        this.mapCenter.set(fallback);
        this.loadCompaniesAround(fallback.lat, fallback.lng, this.currentRadius);
      });
  }

  private loadCompaniesAround(lat: number, lng: number, radiusKm: number): void {
    this.loading.set(true);

    this.nearbyService
      .loadNearbyCompanies(lat, lng, radiusKm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies) => {
          this.currentCompanies = companies
            .filter((company) => company.latitude !== undefined && company.longitude !== undefined)
            .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

          if (this.selectedCompany()) {
            const stillPresent = this.currentCompanies.find((company) => company.id === this.selectedCompany()?.id);
            if (!stillPresent) this.selectedCompany.set(null);
          }

          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }
}
