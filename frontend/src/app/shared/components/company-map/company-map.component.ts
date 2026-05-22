import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

import { Company } from '../../../features/companies/models/company.model';

declare const google: any;
import { LatLng, NearbyCompaniesService } from '../../services/nearby-companies.service';

@Component({
  selector: 'app-company-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './company-map.component.html',
  styleUrl: './company-map.component.scss',
})
export class CompanyMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  private nearbyService = inject(NearbyCompaniesService);

  @Input() companies: Company[] = [];
  @Input() center: LatLng = this.nearbyService.defaultCenter;
  @Input() selectedCompany: Company | null = null;
  @Input() userLocation: LatLng | null = null;

  @Output() companySelected = new EventEmitter<Company>();
  @Output() bookCompany = new EventEmitter<Company>();

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLElement>;

  private map: any | null = null;
  private clusterer: MarkerClusterer | null = null;
  private markers = new Map<string, any>();
  private infoWindows = new Map<string, any>();
  private userLocationMarker: any | null = null;
  private initInterval: ReturnType<typeof setInterval> | null = null;

  ngAfterViewInit(): void {
    console.log('[CompanyMap] ngAfterViewInit: starting map init');
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) return;

    if (changes['center'] && this.center) {
      this.map.setCenter(this.center);
    }

    if (changes['companies'] || changes['selectedCompany']) {
      console.log('[CompanyMap] ngOnChanges: rerender markers', {
        companies: this.companies.length,
        selectedCompanyId: this.selectedCompany?.id ?? null,
      });
      this.renderMarkers();
    }

    if (changes['userLocation']) {
      this.renderUserLocationMarker();
    }
  }

  ngOnDestroy(): void {
    this.clearMarkers();
    this.infoWindows.forEach((windowRef) => windowRef.close());
    this.infoWindows.clear();
    this.clusterer?.clearMarkers();
    this.userLocationMarker?.setMap(null);
    if (this.initInterval) clearInterval(this.initInterval);
  }

  private initMap(): void {
    this.initInterval = setInterval(() => {
      if (!this.nearbyService.hasGoogleMaps() || !this.mapContainer?.nativeElement || this.map) {
        return;
      }

      const mapElement = this.mapContainer.nativeElement;
      const height = mapElement.getBoundingClientRect().height;
      if (height <= 0) {
        console.warn('[CompanyMap] map container height is 0, waiting...');
        return;
      }

      console.log('[CompanyMap] initializing map', {
        center: this.center,
        companies: this.companies.length,
        containerHeight: height,
      });
      this.map = this.nearbyService.createMap(this.mapContainer.nativeElement, this.center);
      this.clusterer = this.nearbyService.createClusterer(this.map);
      this.renderUserLocationMarker();
      this.renderMarkers();

      if (this.initInterval) clearInterval(this.initInterval);
    }, 100);
  }

  private renderUserLocationMarker(): void {
    if (!this.map) return;

    this.userLocationMarker?.setMap(null);
    this.userLocationMarker = null;

    if (!this.userLocation) return;
    this.userLocationMarker = this.nearbyService.addUserLocationMarker(this.map, this.userLocation);
  }

  private renderMarkers(): void {
    if (!this.map) return;

    this.clearMarkers();
    this.clusterer?.clearMarkers();

    const nextMarkers: any[] = [];

    for (const company of this.companies) {
      const lat = company.latitude;
      const lng = company.longitude;
      if (lat === undefined || lng === undefined) continue;

      const isSelected = this.selectedCompany?.id === company.id;
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: this.map,
        title: company.name,
        icon: this.nearbyService.buildMarkerIcon(company, isSelected),
        zIndex: isSelected ? 1000 : 1,
      });

      const actionId = `${company.id}-${Math.random().toString(36).slice(2, 8)}`;
      const infoWindow = this.nearbyService.createInfoWindow(company, actionId);

      marker.addListener('click', () => {
        this.closeInfoWindows();
        infoWindow.open(this.map, marker);
        console.log('[CompanyMap] marker click companySelected', company.id);
        this.companySelected.emit(company);
      });

      infoWindow.addListener('domready', () => {
        const bookButton = document.getElementById(`book-${actionId}`);
        const detailButton = document.getElementById(`detail-${actionId}`);

        bookButton?.addEventListener('click', () => {
          console.log('[CompanyMap] infoWindow bookCompany', company.id);
          this.bookCompany.emit(company);
        });
        detailButton?.addEventListener('click', () => {
          window.location.href = `/company/${company.id}`;
        });
      });

      this.markers.set(company.id, marker);
      this.infoWindows.set(company.id, infoWindow);
      nextMarkers.push(marker);
    }

    console.log('[CompanyMap] markers rendered', {
      requestedCompanies: this.companies.length,
      renderedMarkers: nextMarkers.length,
    });

    if (nextMarkers.length) {
      this.clusterer?.addMarkers(nextMarkers);
      this.nearbyService.fitMapToMarkers(this.map, nextMarkers, this.userLocation);
    } else {
      this.map.setCenter(this.center);
      this.map.setZoom(12);
    }
  }

  private clearMarkers(): void {
    this.markers.forEach((marker) => marker.setMap(null));
    this.markers.clear();
  }

  private closeInfoWindows(): void {
    this.infoWindows.forEach((windowRef) => windowRef.close());
  }
}
