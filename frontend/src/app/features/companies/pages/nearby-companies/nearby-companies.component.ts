import {
  Component,
  signal,
  ViewChildren,
  ViewChild,
  QueryList,
  ElementRef,
  inject,
  OnInit,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule as NgFormsModule } from '@angular/forms';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

import { Company } from '../../models/company.model';
import { CompaniesApiService } from '../../services/companies.api';
import { BookingFlowService } from '../../services/booking-flow.service';

interface CompanyWithCoords extends Company {
  lat?: number;
  lng?: number;
  calculatedDistance?: number;
}

type SortMode = 'distance' | 'rating' | 'available';

@Component({
  selector: 'app-nearby-companies',
  standalone: true,
  imports: [CommonModule, RouterLink, NgFormsModule],
  templateUrl: './nearby-companies.component.html',
  styleUrls: ['./nearby-companies.component.scss'],
})
export class NearbyCompaniesComponent
  implements OnInit, OnDestroy, AfterViewInit {
  private api = inject(CompaniesApiService);
  private bookingFlow = inject(BookingFlowService);
  private destroy$ = new Subject<void>();

  // ── State ──────────────────────────────────────────────────
  searchQuery = '';
  searchFocused = false;
  sortBy: SortMode = 'distance';
  activeFilter: string | null = null;
  currentRadius = 10;

  selectedCompany = signal<CompanyWithCoords | null>(null);
  hoveredCompany = signal<CompanyWithCoords | null>(null);
  mapCenter = signal<{ lat: number; lng: number }>({
    lat: 45.764,
    lng: 4.8357,
  });
  sheetOpen = signal<boolean>(false);
  loading = signal<boolean>(false);
  geolocationLoading = signal<boolean>(false);

  // ── Booking modal ──────────────────────────────────────────
  bookingModalOpen = signal<boolean>(false);
  bookingCompany = signal<CompanyWithCoords | null>(null);
  selectedService = signal<string>('');
  selectedDate = signal<string>('');
  selectedTime = signal<string>('');
  bookingSuccess = signal<boolean>(false);
  bookingLoading = signal<boolean>(false);
  bookingStep = signal<number>(1);

  bookingForm = {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    propertyType: 'apartment',
    rooms: '2',
    surface: 0,
    notes: '',
  };

  // ── Map / markers ──────────────────────────────────────────
  private map: google.maps.Map | null = null;
  private clusterer: MarkerClusterer | null = null;
  private markers = new Map<string, google.maps.Marker>();
  private infoWindows = new Map<string, google.maps.InfoWindow>();
  private userLocationMarker: google.maps.Marker | null = null;
  private geocodeCache = new Map<string, { lat: number; lng: number }>();

  // ── Data ───────────────────────────────────────────────────
  currentCompanies: CompanyWithCoords[] = [];
  addressSuggestions: google.maps.places.AutocompletePrediction[] = [];
  private autocompleteService: google.maps.places.AutocompleteService | null =
    null;
  private searchSubject = new Subject<string>();

  // ── Time slots ─────────────────────────────────────────────
  timeSlots = [
    { label: '08h–10h', value: '08:00' },
    { label: '10h–12h', value: '10:00' },
    { label: '12h–14h', value: '12:00' },
    { label: '14h–16h', value: '14:00' },
    { label: '16h–18h', value: '16:00' },
    { label: '18h–20h', value: '18:00' },
  ];

  @ViewChildren('cardRef') cards!: QueryList<ElementRef>;
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // ── Computed ───────────────────────────────────────────────
  get sortedCompanies(): CompanyWithCoords[] {
    const list = [...this.currentCompanies];
    switch (this.sortBy) {
      case 'rating':
        return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case 'available':
        return list.sort(
          (a, b) => (b.isAvailableNow ? 1 : 0) - (a.isAvailableNow ? 1 : 0),
        );
      default:
        return list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }
  }

  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ══════════════════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════════════════

  ngOnInit() {
    this.initPlacesService();
    this.setupSearchSubscription();
    this.loadInitialCompanies();
  }

  ngAfterViewInit() {
    this.initMapManually();

    // Listen for InfoWindow booking button
    window.addEventListener('openBooking', ((e: CustomEvent) => {
      const company = this.currentCompanies.find((c) => c.id === e.detail);
      if (company) this.bookCompany(company);
    }) as EventListener);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeAllInfoWindows();
    this.clusterer?.clearMarkers();
    this.userLocationMarker?.setMap(null);
  }

  // ══════════════════════════════════════════════════════════
  // MAP INIT
  // ══════════════════════════════════════════════════════════

  private initMapManually() {
    const interval = setInterval(() => {
      if (
        typeof google !== 'undefined' &&
        google.maps &&
        this.mapContainer?.nativeElement &&
        !this.map
      ) {
        clearInterval(interval);

        this.map = new google.maps.Map(this.mapContainer.nativeElement, {
          center: this.mapCenter(),
          zoom: 12,
          gestureHandling: 'greedy',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        this.clusterer = new MarkerClusterer({
          map: this.map,
          algorithmOptions: { maxZoom: 15 },
        });

        if (this.currentCompanies.length > 0) this.updateMarkers();
      }
    }, 100);

    setTimeout(() => clearInterval(interval), 8000);
  }



  // ══════════════════════════════════════════════════════════
  // PLACES / SEARCH
  // ══════════════════════════════════════════════════════════

  private initPlacesService() {
    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && google.maps?.places) {
        this.autocompleteService = new google.maps.places.AutocompleteService();
        clearInterval(interval);
      }
    }, 100);
    setTimeout(() => clearInterval(interval), 8000);
  }

  private setupSearchSubscription() {
    this.searchSubject
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((query) => {
        if (query.length >= 3 && this.autocompleteService) {
          this.autocompleteService.getPlacePredictions(
            { input: query, componentRestrictions: { country: 'fr' } },
            (predictions, status) => {
              this.addressSuggestions =
                status === google.maps.places.PlacesServiceStatus.OK &&
                  predictions
                  ? predictions
                  : [];
            },
          );
        } else {
          this.addressSuggestions = [];
        }
      });
  }

  onSearchInput(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  onSearchFocus() {
    if (this.searchQuery.length >= 3) this.searchSubject.next(this.searchQuery);
  }

  onSearchEnter() {
    if (this.addressSuggestions.length > 0) {
      this.selectAddressSuggestion(this.addressSuggestions[0]);
    }
  }

  clearSuggestions() {
    setTimeout(() => {
      this.addressSuggestions = [];
    }, 200);
  }

  selectAddressSuggestion(
    suggestion: google.maps.places.AutocompletePrediction,
  ) {
    const service = new google.maps.places.PlacesService(
      document.createElement('div'),
    );
    service.getDetails({ placeId: suggestion.place_id }, (place, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        place?.geometry?.location
      ) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        this.mapCenter.set({ lat, lng });
        this.searchQuery = suggestion.description;
        this.addressSuggestions = [];
        this.loadCompaniesAround(lat, lng, this.currentRadius);
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // GEOLOCATION
  // ══════════════════════════════════════════════════════════

  useMyLocation() {
    if (!navigator.geolocation) return;
    this.geolocationLoading.set(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        this.mapCenter.set({ lat, lng });
        this.loadCompaniesAround(lat, lng, this.currentRadius);
        this.addUserLocationMarker(lat, lng);
        this.reverseGeocode(lat, lng);
        this.geolocationLoading.set(false);
      },
      (err) => {
        console.error(err);
        this.geolocationLoading.set(false);
        alert(
          "Impossible d'obtenir votre position. Veuillez saisir votre adresse manuellement.",
        );
      },
      { timeout: 8000 },
    );
  }

  private reverseGeocode(lat: number, lng: number) {
    if (typeof google === 'undefined') return;
    new google.maps.Geocoder().geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          this.searchQuery = results[0].formatted_address;
        }
      },
    );
  }

  private addUserLocationMarker(lat: number, lng: number) {
    if (!this.map) return;
    this.userLocationMarker?.setMap(null);
    this.userLocationMarker = new google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 11,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
      },
      title: 'Votre position',
      zIndex: 1001,
    });
  }

  // ══════════════════════════════════════════════════════════
  // LOADING COMPANIES
  // ══════════════════════════════════════════════════════════

  private loadInitialCompanies() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          this.mapCenter.set({ lat, lng });
          this.loadCompaniesAround(lat, lng, this.currentRadius);
          this.reverseGeocode(lat, lng);
        },
        () => this.loadCompaniesAround(45.764, 4.8357, this.currentRadius),
      );
    } else {
      this.loadCompaniesAround(45.764, 4.8357, this.currentRadius);
    }
  }

  private loadCompaniesAround(lat: number, lng: number, radiusKm: number) {
    this.loading.set(true);

    this.api
      .getNearByCompanies(lat, lng, radiusKm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies) => {
          this.currentCompanies = companies
            .filter((c) => c.latitude && c.longitude)
            .map((c) => ({
              ...c,
              lat: c.latitude,
              lng: c.longitude,
              calculatedDistance: c.distance ?? 0,
            }))
            .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

          this.loading.set(false);
          this.updateMarkers();
        },
        error: (err) => {
          console.error('Error loading companies:', err);
          this.loading.set(false);
        },
      });
  }

  onRadiusChange() {
    const center = this.mapCenter();
    this.loadCompaniesAround(center.lat, center.lng, this.currentRadius);
  }

  // ══════════════════════════════════════════════════════════
  // MARKERS
  // ══════════════════════════════════════════════════════════

  private updateMarkers() {
    if (!this.map) return;

    this.markers.forEach((m) => m.setMap(null));
    this.markers.clear();
    this.clusterer?.clearMarkers();

    const googleMarkers: google.maps.Marker[] = [];

    for (const company of this.currentCompanies) {
      const lat = company.lat ?? company.latitude;
      const lng = company.lng ?? company.longitude;
      if (!lat || !lng) continue;

      const isSelected = this.selectedCompany()?.id === company.id;
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: this.map,
        title: `${company.name} - À partir de ${company.services?.[0]?.basePrice || 0}€`, 
        icon: this.buildMarkerIcon(company, isSelected),
        zIndex: isSelected ? 1000 : 1,
      });
      marker.setIcon(this.buildMarkerIcon(company, isSelected));
      const infoWindow = new google.maps.InfoWindow({
        content: this.buildInfoWindowContent(company),
        pixelOffset: new google.maps.Size(0, -42),
      });

      marker.addListener('click', () => {
        this.closeAllInfoWindows();
        infoWindow.open(this.map, marker);
        this.selectFromMarker(company);
      });
      marker.addListener('mouseover', () => this.hoveredCompany.set(company));
      marker.addListener('mouseout', () => this.hoveredCompany.set(null));

      this.infoWindows.set(company.id, infoWindow);
      this.markers.set(company.id, marker);
      googleMarkers.push(marker);
    }

    if (googleMarkers.length > 0) {
      this.clusterer?.addMarkers(googleMarkers);
      const bounds = new google.maps.LatLngBounds();
      googleMarkers.forEach((m) => {
        const p = m.getPosition();
        if (p) bounds.extend(p);
      });

      // Add the user location to bounds if it exists
      if (this.userLocationMarker) {
        const userPos = this.userLocationMarker.getPosition();
        if (userPos) bounds.extend(userPos);
      }

      this.map.fitBounds(bounds);


      const minZoomLevel = 12;
      const currentZoom = this.map.getZoom();
      if (currentZoom && currentZoom > minZoomLevel) {
        this.map.setZoom(minZoomLevel);
      }
      // OR use a listener to ensure minimum zoom after fitBounds completes
      google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
        if (this.map) {
          const zoom = this.map.getZoom();
          if (zoom && zoom > minZoomLevel) {
            this.map.setZoom(minZoomLevel);
          }
        }
      });
    } else {
      // If no companies, set a default reasonable zoom level
      this.map.setCenter(this.mapCenter());
      this.map.setZoom(12);
    }
  }

  private buildMarkerIcon(
    company: CompanyWithCoords,
    isSelected: boolean,
  ): google.maps.Icon {
    const available = company.isAvailableNow !== false;
    const bg = isSelected ? '#2563eb' : available ? '#10b981' : '#ef4444';
    const size = isSelected ? 52 : 44;

    const basePrice = company.services?.[0]?.basePrice || 0;
    let priceSymbol = '€';
    if (basePrice > 80) priceSymbol = '€€€';
    else if (basePrice > 50) priceSymbol = '€€';
    else if (basePrice > 0) priceSymbol = '€';

    // Create marker with cleaning icon and price
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}">
    <ellipse cx="${size / 2}" cy="${size + 4}" rx="${size / 2 - 4}" ry="3" fill="rgba(0,0,0,.2)"/>
    <!-- Main circle -->
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${bg}" stroke="white" stroke-width="2.5"/>
    <!-- Cleaning icon (broom) -->
    <text x="${size / 2}" y="${size / 2 - 4}" text-anchor="middle" fill="white" font-size="${isSelected ? 16 : 13}">🧹</text>
    <!-- Price indicator -->
    <rect x="${size / 2 - 12}" y="${size / 2 + 4}" width="24" height="12" rx="6" fill="white" opacity="0.9"/>
    <text x="${size / 2}" y="${size / 2 + 13}" text-anchor="middle" fill="${bg}" font-size="9" font-weight="700">${priceSymbol}</text>
  </svg>`;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(size, size + 8),
      anchor: new google.maps.Point(size / 2, size + 8),
    };
  }

  private buildInfoWindowContent(company: CompanyWithCoords): string {
    const rating = company.rating?.toFixed(1) ?? '4.5';
    const dist = company.distance
      ? company.distance < 1000
        ? `${Math.round(company.distance)} m`
        : `${(company.distance / 1000).toFixed(1)} km`
      : '';
    const avail = company.isAvailableNow !== false;

    // Store reference for button click
    (window as any).__cpActions = (window as any).__cpActions ?? {};
    (window as any).__cpActions[company.id] = () => this.bookCompany(company);

    // Enhanced info window with better styling and cleaning company details
    return `<div style="font-family:'DM Sans',system-ui,sans-serif;min-width:210px;padding:6px 4px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="width:40px;height:40px;border-radius:10px;background:#e6f7e6;display:flex;align-items:center;justify-content:center;font-weight:700;color:#2e7d32;font-size:14px">
          ${this.getInitials(company.name)}
        </div>
        <div>
          <div style="font-weight:700;font-size:14px;color:#1e293b">${company.name}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px">⭐ ${rating}${dist ? ' · 📍 ' + dist : ''}</div>
        </div>
      </div>
      ${company.services?.[0]?.name ? `<div style="font-size:11px;color:#475569;margin-bottom:8px;background:#f8fafc;padding:4px 8px;border-radius:16px;display:inline-block">🧹 ${company.services[0].name}</div>` : ''}
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:12px">
        <span style="width:8px;height:8px;border-radius:50%;background:${avail ? '#10b981' : '#ef4444'};display:inline-block"></span>
        <span style="font-size:11px;font-weight:600;color:${avail ? '#10b981' : '#ef4444'}">${avail ? 'Disponible maintenant' : 'Indisponible'}</span>
      </div>
      <div style="display:flex;gap:8px">
        <button onclick="(window.__cpActions['${company.id}'])()"
          style="flex:1;padding:7px 0;background:#2563eb;color:white;border:none;border-radius:24px;font-size:12px;font-weight:600;cursor:pointer;transition:background 0.2s">
          Réserver
        </button>
        <button onclick="window.location.href='/company/${company.id}'"
          style="padding:7px 14px;background:#f1f5f9;color:#475569;border:none;border-radius:24px;font-size:12px;font-weight:600;cursor:pointer;transition:background 0.2s">
          Détails
        </button>
      </div>
    </div>`;
  }

  private closeAllInfoWindows() {
    this.infoWindows.forEach((iw) => iw.close());
  }

  // ══════════════════════════════════════════════════════════
  // INTERACTIONS
  // ══════════════════════════════════════════════════════════

  setSortBy(mode: SortMode) {
    this.sortBy = mode;
  }

  clearFilter() {
    this.activeFilter = null;
  }

  highlightCompany(company: CompanyWithCoords) {
    this.hoveredCompany.set(company);
    const marker = this.markers.get(company.id);
    if (marker) {
      marker.setIcon(this.buildMarkerIcon(company, false));
      marker.setZIndex(900);
    }
  }

  clearHighlight() {
    const prev = this.hoveredCompany();
    this.hoveredCompany.set(null);
    if (prev) {
      const marker = this.markers.get(prev.id);
      if (marker) {
        marker.setIcon(
          this.buildMarkerIcon(prev, this.selectedCompany()?.id === prev.id),
        );
        marker.setZIndex(1);
      }
    }
  }

  selectCompany(company: CompanyWithCoords, index: number) {
    const prev = this.selectedCompany();
    this.selectedCompany.set(company);

    // Update marker icons
    if (prev) {
      const m = this.markers.get(prev.id);
      m?.setIcon(this.buildMarkerIcon(prev, false));
    }
    const m = this.markers.get(company.id);
    m?.setIcon(this.buildMarkerIcon(company, true));
    m?.setZIndex(1000);

    this.map?.panTo({
      lat: company.lat ?? company.latitude ?? 0,
      lng: company.lng ?? company.longitude ?? 0,
    });
    this.scrollTo(index);
  }

  selectFromMarker(company: CompanyWithCoords) {
    const idx = this.currentCompanies.findIndex((c) => c.id === company.id);
    if (idx !== -1) this.selectCompany(company, idx);
  }

  private scrollTo(index: number) {
    setTimeout(() => {
      const el = this.cards.get(index);
      el?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }, 100);
  }

  toggleSheet() {
    this.sheetOpen.update((v) => !v);
  }
  closeSheet() {
    this.sheetOpen.set(false);
  }

  // ══════════════════════════════════════════════════════════
  // BOOKING
  // ══════════════════════════════════════════════════════════

  bookCompany(company: CompanyWithCoords) {
    this.bookingCompany.set(company);
    this.selectedService.set(company.services?.[0]?.id ?? '');
    this.selectedDate.set('');
    this.selectedTime.set('');
    this.bookingSuccess.set(false);
    this.bookingStep.set(1);
    this.bookingForm = {
      fullName: '',
      email: '',
      phone: '',
      address: this.searchQuery || '',
      propertyType: 'apartment',
      rooms: '2',
      surface: 0,
      notes: '',
    };
    this.bookingModalOpen.set(true);
  }

  closeBookingModal() {
    this.bookingModalOpen.set(false);
    this.bookingCompany.set(null);
    this.selectedService.set('');
    this.selectedDate.set('');
    this.selectedTime.set('');
    this.bookingSuccess.set(false);
  }

  nextBookingStep() {
    if (this.bookingStep() < 3) this.bookingStep.update((s) => s + 1);
  }

  prevBookingStep() {
    if (this.bookingStep() > 1) this.bookingStep.update((s) => s - 1);
  }

  confirmBooking() {
    const company = this.bookingCompany();
    const serviceId = this.selectedService();
    if (!company || !serviceId || !this.selectedDate() || !this.selectedTime())
      return;

    this.bookingLoading.set(true);

    const dateTimeStr = `${this.selectedDate()}T${this.selectedTime()}:00`;
    const bookingRequest = {
      serviceId,
      address: this.bookingForm.address,
      startTime: dateTimeStr,
      price: 0,
    };

    this.bookingFlow
      .createBookingWithClient(company.id, bookingRequest, {
        fullName: this.bookingForm.fullName,
        email: this.bookingForm.email,
        phone: this.bookingForm.phone,
        address: this.bookingForm.address,
      })
      .subscribe({
        next: () => {
          this.bookingLoading.set(false);
          this.bookingSuccess.set(true);
        },
        error: (err) => {
          console.error(err);
          this.bookingLoading.set(false);
          alert(err?.message ?? 'Erreur lors de la réservation. Veuillez réessayer.');
        },
      });
  }

  // ══════════════════════════════════════════════════════════
  // UTILITIES
  // ══════════════════════════════════════════════════════════

  getInitials(name: string | null | undefined): string {
    if (!name) return '??';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDistance(m: number | undefined): string {
    if (!m && m !== 0) return '';
    return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
  }

  getFirstService(company: Company): string | null {
    return company.services?.[0]?.name ?? null;
  }

  getExtraServicesCount(company: Company): number {
    return Math.max(0, (company.services?.length ?? 0) - 1);
  }

  getServices(company: Company) {
    return company.services ?? [];
  }

  getServiceName(serviceId: string): string {
    const company = this.bookingCompany();
    return company?.services?.find((s) => s.id === serviceId)?.name ?? '';
  }

  trackByCompanyId(_: number, company: Company): string {
    return company.id;
  }
}