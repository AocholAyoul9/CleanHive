export interface Booking {
  id: string;

  // Company
  companyId: string;
  companyName: string;

  // Client
  clientId: string;
  clientName: string;

  // Service
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;

  // Booking Times
  startTime: string; // ISO string from backend
  endTime: string;   // ISO string from backend

  // Address
  address: string;
  // Price
  price: number;

  // Review / Rating
  rating?: number;
  review?: string;

  // Status
  status: string;
  durationMinutes?: number;

  // Auto-assigned employee (backend adds this)
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
}


export interface CreateBookingRequest {
  serviceId: string;    
  startTime: string;    
  address: string;   
  price?: number;
}
