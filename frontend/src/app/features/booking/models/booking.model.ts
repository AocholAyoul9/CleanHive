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
  serviceId: string;    // ID of the selected service
  startTime: string;    // ISO string of the booking start time
  address: string;      // Address for the booking
  price?: number;
}
