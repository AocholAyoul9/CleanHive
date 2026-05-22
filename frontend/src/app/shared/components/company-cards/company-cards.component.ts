import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Company } from '../../../features/companies/models/company.model';
import { NearbyCompaniesService } from '../../services/nearby-companies.service';

@Component({
  selector: 'app-company-cards',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './company-cards.component.html',
  styleUrl: './company-cards.component.scss',
})
export class CompanyCardsComponent {
  private nearbyService = inject(NearbyCompaniesService);

  @Input() companies: Company[] = [];
  @Input() selectedCompany: Company | null = null;
  @Input() loading = false;
  @Input() emptyTitle = 'Aucune entreprise trouvée';
  @Input() emptyDescription = "Essayez d'élargir votre zone de recherche ou de modifier l'adresse.";

  @Output() companySelected = new EventEmitter<Company>();
  @Output() bookCompany = new EventEmitter<Company>();

  getInitials(name: string | undefined): string {
    return this.nearbyService.getInitials(name ?? '');
  }

  formatDistance(distance: number | undefined): string {
    return this.nearbyService.formatDistance(distance);
  }

  getFirstService(company: Company): string | null {
    return company.services?.[0]?.name ?? null;
  }

  getExtraServicesCount(company: Company): number {
    return Math.max(0, (company.services?.length ?? 0) - 1);
  }

  trackByCompanyId(_: number, company: Company): string {
    return company.id;
  }

  onSelectCompany(company: Company): void {
    console.log('[CompanyCards] companySelected', company.id);
    this.companySelected.emit(company);
  }

  onBookCompany(company: Company): void {
    console.log('[CompanyCards] bookCompany', company.id);
    this.bookCompany.emit(company);
  }
}
