import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

import { Company } from '../../features/companies/models/company.model';
import { CompaniesApiService } from '../../features/companies/services/companies.api';

interface GoogleAutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
}

declare const google: any;

export interface AddressSuggestion extends GoogleAutocompletePrediction {}

export interface LatLng {
  lat: number;
  lng: number;
}

@Injectable({ providedIn: 'root' })
export class NearbyCompaniesService {
  private api = inject(CompaniesApiService);

  defaultCenter: LatLng = { lat: 45.764, lng: 4.8357 };

  getUserLocation(timeout = 8000): Promise<LatLng> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        (error) => reject(error),
        { timeout },
      );
    });
  }

  reverseGeocode(lat: number, lng: number): Promise<string | null> {
    if (!this.hasGoogleMaps()) return Promise.resolve(null);

    return new Promise((resolve) => {
      new google.maps.Geocoder().geocode(
        { location: { lat, lng } },
        (results: Array<{ formatted_address?: string }> | null, status: string) => {
          if (status === 'OK' && results?.[0]?.formatted_address) {
            resolve(results[0].formatted_address);
            return;
          }
          resolve(null);
        },
      );
    });
  }

  getAutocompleteSuggestions(query: string, country = 'fr'): Promise<AddressSuggestion[]> {
    if (!this.hasGooglePlaces() || query.trim().length < 3) {
      return Promise.resolve([]);
    }

    return new Promise((resolve) => {
      const autocompleteService = new google.maps.places.AutocompleteService();
      autocompleteService.getPlacePredictions(
        { input: query, componentRestrictions: { country } },
        (predictions: GoogleAutocompletePrediction[] | null, status: string) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions);
            return;
          }
          resolve([]);
        },
      );
    });
  }

  getPlaceCoordinates(placeId: string): Promise<{ lat: number; lng: number; address: string } | null> {
    if (!this.hasGooglePlaces()) return Promise.resolve(null);

    return new Promise((resolve) => {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails({ placeId }, (place: any, status: string) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place?.geometry?.location
        ) {
          resolve({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address ?? place.name ?? '',
          });
          return;
        }
        resolve(null);
      });
    });
  }

  loadNearbyCompanies(lat: number, lng: number, radiusKm: number): Observable<Company[]> {
    return this.api.getNearByCompanies(lat, lng, radiusKm);
  }

  createMap(container: HTMLElement, center: LatLng): any {
    return new google.maps.Map(container, {
      center,
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
  }

  createClusterer(map: any): MarkerClusterer {
    return new MarkerClusterer({
      map,
      algorithmOptions: { maxZoom: 15 },
    });
  }

  addUserLocationMarker(map: any, location: LatLng): any {
    return new google.maps.Marker({
      position: location,
      map,
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

  buildMarkerIcon(company: Company, isSelected: boolean): { url: string; scaledSize: any; anchor: any } {
    const available = company.isAvailableNow !== false;
    const bg = isSelected ? '#2563eb' : available ? '#10b981' : '#ef4444';
    const size = isSelected ? 52 : 44;

    const basePrice = company.services?.[0]?.basePrice || 0;
    let priceSymbol = '€';
    if (basePrice > 80) priceSymbol = '€€€';
    else if (basePrice > 50) priceSymbol = '€€';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}">
      <ellipse cx="${size / 2}" cy="${size + 4}" rx="${size / 2 - 4}" ry="3" fill="rgba(0,0,0,.2)"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${bg}" stroke="white" stroke-width="2.5"/>
      <text x="${size / 2}" y="${size / 2 - 4}" text-anchor="middle" fill="white" font-size="${isSelected ? 16 : 13}">🧹</text>
      <rect x="${size / 2 - 12}" y="${size / 2 + 4}" width="24" height="12" rx="6" fill="white" opacity="0.9"/>
      <text x="${size / 2}" y="${size / 2 + 13}" text-anchor="middle" fill="${bg}" font-size="9" font-weight="700">${priceSymbol}</text>
    </svg>`;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(size, size + 8),
      anchor: new google.maps.Point(size / 2, size + 8),
    };
  }

  createInfoWindow(company: Company, actionId: string): any {
    const rating = company.rating?.toFixed(1) ?? '4.5';
    const dist = this.formatDistance(company.distance);
    const avail = company.isAvailableNow !== false;

    return new google.maps.InfoWindow({
      content: `<div style="font-family:'DM Sans',system-ui,sans-serif;min-width:210px;padding:6px 4px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="width:40px;height:40px;border-radius:10px;background:#e6f7e6;display:flex;align-items:center;justify-content:center;font-weight:700;color:#2e7d32;font-size:14px">
            ${this.getInitials(company.name)}
          </div>
          <div>
            <div style="font-weight:700;font-size:14px;color:#1e293b">${company.name}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px">⭐ ${rating}${dist ? ` · 📍 ${dist}` : ''}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:12px">
          <span style="width:8px;height:8px;border-radius:50%;background:${avail ? '#10b981' : '#ef4444'};display:inline-block"></span>
          <span style="font-size:11px;font-weight:600;color:${avail ? '#10b981' : '#ef4444'}">${avail ? 'Disponible maintenant' : 'Indisponible'}</span>
        </div>
        <div style="display:flex;gap:8px">
          <button id="book-${actionId}" style="flex:1;padding:7px 0;background:#2563eb;color:white;border:none;border-radius:24px;font-size:12px;font-weight:600;cursor:pointer">Réserver</button>
          <button id="detail-${actionId}" style="padding:7px 14px;background:#f1f5f9;color:#475569;border:none;border-radius:24px;font-size:12px;font-weight:600;cursor:pointer">Détails</button>
        </div>
      </div>`,
      pixelOffset: new google.maps.Size(0, -42),
    });
  }

  fitMapToMarkers(map: any, markers: any[], userLocation?: LatLng | null): void {
    if (!markers.length) {
      map.setCenter(this.defaultCenter);
      map.setZoom(12);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const marker of markers) {
      const position = marker.getPosition();
      if (position) bounds.extend(position);
    }

    if (userLocation) bounds.extend(userLocation);

    map.fitBounds(bounds);

    const minZoomLevel = 12;
    const currentZoom = map.getZoom();
    if (currentZoom && currentZoom > minZoomLevel) {
      map.setZoom(minZoomLevel);
    }
    google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
      const zoom = map.getZoom();
      if (zoom && zoom > minZoomLevel) {
        map.setZoom(minZoomLevel);
      }
    });
  }

  formatDistance(distanceMeters: number | undefined): string {
    if (distanceMeters === undefined || distanceMeters === null) return '';
    return distanceMeters < 1000
      ? `${Math.round(distanceMeters)} m`
      : `${(distanceMeters / 1000).toFixed(1)} km`;
  }

  getInitials(name: string | null | undefined): string {
    if (!name) return '??';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  hasGoogleMaps(): boolean {
    return typeof google !== 'undefined' && !!google?.maps;
  }

  hasGooglePlaces(): boolean {
    return this.hasGoogleMaps() && !!google?.maps?.places;
  }
}
