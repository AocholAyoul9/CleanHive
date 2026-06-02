import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';   // for template-driven form
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-pro-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pro-signup.component.html',
  styleUrls: ['./pro-signup.component.scss']
})
export class ProSignupComponent {
  constructor(private notificationService: NotificationService) {}
  // Form data
  proData = {
    companyName: '',
    siret: '',
    contactName: '',
    email: '',
    phone: '',
    message: ''
  };

  submitting = signal(false);

  // Steps (pro-specific)
  proSteps = [
    {
      icon: 'fas fa-file-signature',
      title: 'Inscrivez-vous gratuitement',
      description: 'Remplissez le formulaire, nous vérifions votre entreprise sous 48h.'
    },
    {
      icon: 'fas fa-bell',
      title: 'Recevez des missions',
      description: 'Les clients réservent, vous recevez une notification et acceptez en un clic.'
    },
    {
      icon: 'fas fa-broom',
      title: 'Intervenez, soyez payé',
      description: 'Le paiement est déclenché après intervention, NetProxi s’occupe de la facturation.'
    }
  ];

  // Detailed benefits
  proBenefits = [
    {
      icon: 'fas fa-paper-plane',
      title: 'Missions automatiques',
      description: 'Fini la prospection : les clients vous trouvent et réservent en ligne.'
    },
    {
      icon: 'fas fa-users',
      title: 'Gestion des employés',
      description: 'Attribuez les missions à vos agents, suivez leur planning en temps réel.'
    },
    {
      icon: 'fas fa-calendar-alt',
      title: 'Planning optimisé',
      description: 'Visualisez toutes vos interventions, évitez les trous et les conflits.'
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Tableau de bord',
      description: 'Chiffre d’affaires, satisfaction client, taux de remplissage : tout est là.'
    },
    {
      icon: 'fas fa-file-invoice',
      title: 'Facturation automatique',
      description: 'Devis, factures, relances : nous automatisons toute la paperasse.'
    },
    {
      icon: 'fas fa-headset',
      title: 'Support dédié',
      description: 'Une équipe disponible 7j/7 pour vous aider, par chat ou téléphone.'
    }
  ];

  // Testimonials from partner companies
  proTestimonials = [
    {
      name: 'Karim B.',
      company: 'Propreté Plus, Lyon',
      initials: 'KB',
      rating: 5,
      text: 'NetProxi nous a apporté 30% de missions en plus en trois mois. La plateforme est intuitive et le support réactif.'
    },
    {
      name: 'Céline D.',
      company: 'Nett & Co, Paris',
      initials: 'CD',
      rating: 5,
      text: 'La gestion du planning est parfaite pour notre équipe de 6 agents. Nous gagnons un temps fou chaque semaine.'
    }
  ];

  submitProForm(form: NgForm): void {
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.notificationService.error('Please complete all required fields.');
      return;
    }

    this.submitting.set(true);

    // Simulate API call
    setTimeout(() => {
      this.notificationService.success(
        'Votre candidature a bien été envoyée ! Nous vous recontacterons sous 48h.',
      );
      this.submitting.set(false);
      form.resetForm();
      // OR this.router.navigate(['/pro/confirmation']);
    }, 1500);

    // In production, replace with a service call:
    // this.proService.register(this.proData).subscribe({ ... });
  }

  scrollToSignup() {
  const element = document.getElementById('signup-form');

  element?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

  stars(n: number): number[] {
    return Array(n).fill(0);
  }
}