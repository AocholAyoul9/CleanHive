export interface Client {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  token: string;
}

export interface CompanyService {
  id: string;
  name: string;
  description?: string;
  price?: number;
  basePrice?: number;
  duration?: number;
  durationInMinutes?: number;
  category?: string;
}

export interface NearbyCompany {
  id: string;
  name: string;
  logoUrl?: string;
  address: string;
  distance: number;
  rating: number;
  isFavorite: boolean;
  services: CompanyService[];
  selectedService?: CompanyService | null;

  latitude?: number;
  longitude?: number;
  reviewsCount?: number;
  isAvailableNow?: boolean;
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  joinDate: Date;
}
