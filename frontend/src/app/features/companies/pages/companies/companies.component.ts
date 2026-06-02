import {
  Component,
  signal,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription, from, of, combineLatest } from 'rxjs';
import { map, switchMap, mergeMap, toArray, tap, catchError } from 'rxjs/operators';
import * as L from 'leaflet';

import * as CompanyActions from '../../state/company.actions';
import * as CompanySelectors from '../../state/company.selectors';
import {
  Company,
  ServiceResponseDto as ServiceModel,
  getPriceRange,
} from '../../models/company.model';
import { GeocodingService } from '../../services/geocoding.service'; // à créer
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.scss'],
})
export class CompaniesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // Filtres
  searchQuery = signal('');
  serviceFilter = signal('');
  activeServiceFilter = signal('');

  // Localisation par défaut (France)
  lat = signal<number | null>(48.8566);
  lng = signal<number | null>(2.3522);

  // Données entreprises
  allCompanies$: Observable<Company[]>;
  filteredCompanies$: Observable<Company[]>;
  companiesWithCoords$!: Observable<(Company & { coordinates?: { lat: number; lng: number } })[]>;

  // Modal de réservation
  bookingCompany = signal<Company | null>(null);
  selectedService = signal<ServiceModel | null>(null);
  bookingSuccess = signal('');

  // Carte Leaflet
  private map!: L.Map;
  private markers: L.Marker[] = [];
  private subscriptions = new Subscription();

  // Géocodage – cache pour éviter les appels multiples
  private geocodingCache = new Map<string, { lat: number; lng: number }>();
  private geocodingInProgress = new Set<string>();

  constructor(
    private store: Store,
    private geocodingService: GeocodingService,
    private notificationService: NotificationService,
  ) {
    this.allCompanies$ = this.store.select(CompanySelectors.selectAllCompanies);
    this.filteredCompanies$ = this.createFilteredCompanies();
  }

  ngOnInit(): void {
    this.store.dispatch(CompanyActions.loadAllCompanies());

    // Crée l'observable des entreprises avec coordonnées (géocodage si nécessaire)
    this.companiesWithCoords$ = this.filteredCompanies$.pipe(
      switchMap(companies =>
        from(companies).pipe(
          mergeMap(company => this.enrichCompanyWithCoordinates(company)),
          toArray()
        )
      )
    );
  }

  ngAfterViewInit(): void {
    this.initMap();

    // Mise à jour des marqueurs quand les entreprises changent
    this.subscriptions.add(
      this.companiesWithCoords$.subscribe(companies => {
        this.updateMarkers(companies);
      })
    );

    // Gestion des clics sur les boutons des popups
    this.mapContainer.nativeElement.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('popup-button')) {
        const companyId = target.getAttribute('data-id');
        if (companyId) {
          // Récupérer l'entreprise depuis le flux pour ouvrir le modal
          this.companiesWithCoords$.subscribe(companies => {
            const company = companies.find(c => c.id === companyId);
            if (company) this.openBooking(company);
          });
        }
      }
    });

    window.addEventListener('resize', () => this.map?.invalidateSize());
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.map) {
      this.map.remove();
    }
  }

  // ======================== CARTE ========================

  /**
   * Initialise la carte Leaflet avec OpenStreetMap
   */
  private initMap(): void {
    const center: L.LatLngExpression = [this.lat() || 48.8566, this.lng() || 2.3522];
    this.map = L.map(this.mapContainer.nativeElement).setView(center, 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);
  }

  /**
   * Met à jour les marqueurs à partir des entreprises avec coordonnées
   */
  private updateMarkers(companies: (Company & { coordinates?: { lat: number; lng: number } })[]): void {
    // Supprimer les anciens marqueurs
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    // Filtrer les entreprises qui ont des coordonnées
    const companiesWithCoords = companies.filter(c => c.coordinates);

    companiesWithCoords.forEach(company => {
      const marker = L.marker([company.coordinates!.lat, company.coordinates!.lng], {
        icon: this.getCompanyIcon(company),
      }).addTo(this.map);

      // Popup avec les informations de l'entreprise
      marker.bindPopup(this.buildPopupContent(company));

      // Ouvrir le modal au clic sur le marqueur
      marker.on('click', () => this.openBooking(company));

      this.markers.push(marker);
    });

    // Ajuster la vue pour montrer tous les marqueurs
    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  /**
   * Icône personnalisée pour le marqueur (disponibilité, couleur)
   */
  private getCompanyIcon(company: Company): L.DivIcon {
    const isAvailable = this.isCompanyAvailable(company);
    const backgroundColor = isAvailable ? '#22c55e' : '#ef4444';

    return L.divIcon({
      html: `
        <div class="relative">
          <div class="w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
               style="background-color: ${backgroundColor}">
            <span class="text-sm font-bold text-white">${this.getInitials(company.name)}</span>
          </div>
          ${
            isAvailable
              ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white"></div>'
              : ''
          }
        </div>
      `,
      className: 'border-none bg-transparent',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });
  }

  /**
   * Contenu HTML du popup affiché lors du clic sur un marqueur
   */
  private buildPopupContent(company: Company): string {
    return `
      <div class="popup-content">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200">
            <span class="font-bold">${this.getInitials(company.name)}</span>
          </div>
          <div>
            <h3 class="font-semibold">${company.name}</h3>
            ${
              company.isVerified
                ? '<span class="text-xs text-green-600">✓ Vérifiée</span>'
                : ''
            }
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-2">${
          company.address || 'Adresse non disponible'
        }</p>
        <div class="flex justify-between items-center">
          <span class="text-sm">⭐ ${company.rating || '4.5'} (${
      company.reviewsCount || 0
    } avis)</span>
          <button class="popup-button" data-id="${company.id}">Réserver</button>
        </div>
      </div>
    `;
  }

  // ======================== GÉOCODAGE ========================

  /**
   * Enrichit une entreprise avec ses coordonnées géographiques.
   * Utilise les champs latitude/longitude si présents, sinon géocode l'adresse.
   */
  private enrichCompanyWithCoordinates(
    company: Company
  ): Observable<Company & { coordinates?: { lat: number; lng: number } }> {
    // Si les coordonnées sont déjà dans l'objet
    if (company.latitude && company.longitude) {
      return of({
        ...company,
        coordinates: { lat: company.latitude, lng: company.longitude },
      });
    }

    // Si pas d'adresse, impossible de géocoder
    if (!company.address) {
      return of({ ...company, coordinates: undefined });
    }

    // Store address in a local variable to help TypeScript narrow the type
    const address = company.address;

    // Vérifier le cache
    const cached = this.geocodingCache.get(address);
    if (cached) {
      return of({ ...company, coordinates: cached });
    }

    // Éviter les appels simultanés pour la même adresse
    if (this.geocodingInProgress.has(address)) {
      // Pour simplifier, on renvoie sans coordonnées (on ne bloque pas)
      // Dans une implémentation plus avancée, on pourrait attendre le résultat
      return of({ ...company, coordinates: undefined });
    }

    this.geocodingInProgress.add(address);

    return this.geocodingService.geocodeAddress(address).pipe(
      tap(coords => {
        if (coords) {
          this.geocodingCache.set(address, coords);
        }
        this.geocodingInProgress.delete(address);
      }),
      map(coords => ({ ...company, coordinates: coords || undefined })),
      catchError(() => {
        this.geocodingInProgress.delete(address);
        return of({ ...company, coordinates: undefined });
      })
    );
  }

  // ======================== MÉTHODES EXISTANTES (filtres, réservation, etc.) ========================

  /**
   * Filtrage des entreprises selon la recherche et le service
   */
  private createFilteredCompanies(): Observable<Company[]> {
    return this.allCompanies$.pipe(
      map(companies => {
        const searchQuery = this.searchQuery().toLowerCase();
        const serviceFilter = this.serviceFilter();

        return companies.filter(company => {
          const matchesSearch =
            !searchQuery ||
            company.name?.toLowerCase().includes(searchQuery) ||
            company.address?.toLowerCase().includes(searchQuery) ||
            company.description?.toLowerCase().includes(searchQuery);

          const matchesService =
            !serviceFilter ||
            company.services?.some(
              service => service.name?.toLowerCase() === serviceFilter.toLowerCase()
            );

          return matchesSearch && matchesService;
        });
      })
    );
  }

  getPriceDisplay(company: Company): string {
    return getPriceRange(company);
  }

  isCompanyAvailable(company: Company): boolean {
    return company.isAvailableNow ?? Math.random() > 0.3; // Démo
  }

  setServiceFilter(service: string) {
    this.serviceFilter.set(service);
    this.activeServiceFilter.set(service);
  }

  onSearchQueryChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  getInitials(companyName: string): string {
    if (!companyName) return 'N';
    return companyName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  openBooking(company: Company) {
    this.bookingCompany.set(company);
    this.selectedService.set(null);
    this.bookingSuccess.set('');
  }

  confirmBooking() {
    if (!this.bookingCompany() || !this.selectedService()) {
      this.notificationService.error('Please select a service before confirming booking.');
      return;
    }

    const company = this.bookingCompany()!;
    const service = this.selectedService()!;

    this.bookingSuccess.set(
      `Réservation confirmée pour ${company.name} (${service.name}) ! Un email de confirmation vous a été envoyé.`
    );
    this.notificationService.success('Booking created successfully.');

    setTimeout(() => {
      if (this.bookingSuccess()) {
        this.closeBooking();
      }
    }, 3000);
  }

  closeBooking() {
    this.bookingCompany.set(null);
    this.selectedService.set(null);
    this.bookingSuccess.set('');
  }

  getCompaniesCount(companies: Company[] | null): number {
    return companies?.length || 0;
  }

  onServiceSelect(serviceName: string): void {
    if (!serviceName) {
      this.selectedService.set(null);
      return;
    }

    const company = this.bookingCompany();
    if (company?.services) {
      const selectedService = company.services.find(s => s.name === serviceName);
      this.selectedService.set(selectedService || null);
    }
  }

  getRandomDistance(): number {
    return Math.random() * 10 + 0.1;
  }

  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  }
}