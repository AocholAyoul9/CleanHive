import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  signal,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Company } from '../../../features/companies/models/company.model';
import { BookingFlowService } from '../../../features/companies/services/booking-flow.service';
import { NearbyCompaniesService } from '../../services/nearby-companies.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-modal.component.html',
  styleUrl: './booking-modal.component.scss',
})
export class BookingModalComponent implements OnChanges {
  private bookingFlow = inject(BookingFlowService);
  private nearbyService = inject(NearbyCompaniesService);
  private notificationService = inject(NotificationService);

  @Input() open = false;
  @Input() company: Company | null = null;
  @Input() initialAddress = '';

  @Output() closed = new EventEmitter<void>();
  @Output() bookingCompleted = new EventEmitter<void>();

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

  timeSlots = [
    { label: '08h–10h', value: '08:00' },
    { label: '10h–12h', value: '10:00' },
    { label: '12h–14h', value: '12:00' },
    { label: '14h–16h', value: '14:00' },
    { label: '16h–18h', value: '16:00' },
    { label: '18h–20h', value: '18:00' },
  ];

  todayDate = computed(() => new Date().toISOString().split('T')[0]);

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['open'] || changes['company']) && this.open && this.company) {
      this.resetForm();
    }
  }

  closeBookingModal(): void {
    this.closed.emit();
  }

  nextBookingStep(): void {
    if (this.bookingStep() < 3) this.bookingStep.update((value) => value + 1);
  }

  prevBookingStep(): void {
    if (this.bookingStep() > 1) this.bookingStep.update((value) => value - 1);
  }

  confirmBooking(): void {
    if (!this.company || !this.selectedService() || !this.selectedDate() || !this.selectedTime()) {
      this.notificationService.error('Please complete all booking fields before submitting.');
      return;
    }

    this.bookingLoading.set(true);

    this.bookingFlow
      .createBookingWithClient(
        this.company.id,
        {
          serviceId: this.selectedService(),
          address: this.bookingForm.address,
          startTime: `${this.selectedDate()}T${this.selectedTime()}:00`,
          price: 0,
        },
      )
      .subscribe({
        next: () => {
          this.bookingLoading.set(false);
          this.bookingSuccess.set(true);
          this.bookingCompleted.emit();
        },
        error: (error: any) => {
          this.bookingLoading.set(false);

          const status =
            error?.status ||
            error?.cause?.status;

          if (status === 401 || status === 403) {
            this.notificationService.error('Vous devez être connecté pour réserver un service.');
            return;
          }

          this.notificationService.error(
            error?.message ||
            'Erreur lors de la réservation. Veuillez réessayer.'
          );
        }
      });
  }

  getInitials(name: string | null | undefined): string {
    return this.nearbyService.getInitials(name);
  }

  getServices(company: Company): NonNullable<Company['services']> {
    return company.services ?? [];
  }

  getServiceName(serviceId: string): string {
    return this.company?.services?.find((service) => service.id === serviceId)?.name ?? '';
  }

  private resetForm(): void {
    this.selectedService.set(this.company?.services?.[0]?.id ?? '');
    this.selectedDate.set('');
    this.selectedTime.set('');
    this.bookingSuccess.set(false);
    this.bookingLoading.set(false);
    this.bookingStep.set(1);
    this.bookingForm = {
      fullName: '',
      email: '',
      phone: '',
      address: this.initialAddress || '',
      propertyType: 'apartment',
      rooms: '2',
      surface: 0,
      notes: '',
    };
  }
}
