import { Component, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {
  searchQuery = '';
  loading = signal(false);
  geoLoading = signal(false);

  // Sticky header state
  isHeaderVisible = false;

  private statsAnimated = false;

  constructor(
    private router: Router,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.statsAnimated) {
          this.statsAnimated = true;
          this.animateStats();
        }
      });
    }, { threshold: 0.3 });

    setTimeout(() => {
      const statsEl = document.querySelector('.stats');
      if (statsEl) observer.observe(statsEl);
    }, 100);
  }

  ngOnDestroy(): void {}

  // Show sticky header when user scrolls past the hero section
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const hero = document.getElementById('hero');
    if (hero) {
      const heroBottom = hero.getBoundingClientRect().bottom;
      this.isHeaderVisible = heroBottom < 0;
    }
  }

  // Search handler – accepts an optional event to prevent form submission
  onSearch(event?: Event): void {
    if (event) event.preventDefault();

    if (!this.searchQuery.trim()) {
      const input = document.querySelector('.search-input') as HTMLInputElement;
      input?.classList.add('shake');
      setTimeout(() => input?.classList.remove('shake'), 500);
      return;
    }

    this.loading.set(true);

    setTimeout(() => {
      this.loading.set(false);
      this.router.navigate(['/nearby'], {
        queryParams: { q: this.searchQuery }
      });
    }, 600);
  }

  useMyLocation(): void {
    if (!navigator.geolocation) {
      this.notificationService.error('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }

    this.geoLoading.set(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const addr = data.address;
          const formatted = [
            addr.house_number,
            addr.road,
            addr.postcode,
            addr.city || addr.town || addr.village
          ].filter(Boolean).join(' ');

          this.searchQuery = formatted || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        } catch {
          this.searchQuery = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
        } finally {
          this.geoLoading.set(false);
          this.onSearch();
        }
      },
      (err) => {
        this.geoLoading.set(false);
        this.notificationService.error(
          'Impossible d\'obtenir votre position. Veuillez la saisir manuellement.',
        );
      },
      { timeout: 8000 }
    );
  }

  goToNearby(): void {
    this.router.navigate(['/nearby']);
  }

  goToProSignup(): void {
    this.router.navigate(['/pro/signup']);
  }

  private animateStats(): void {
    this.stats.forEach((stat, i) => {
      const el = document.querySelectorAll('.stat-value')[i] as HTMLElement;
      if (!el) return;

      const raw = stat.rawValue;
      const suffix = stat.suffix;
      const duration = 1800;
      const start = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * raw);
        el.textContent = current.toLocaleString('fr-FR') + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      };

      setTimeout(() => requestAnimationFrame(tick), i * 150);
    });
  }

  // --- Data ---

  steps = [
    {
      icon: 'fas fa-map-marker-alt',
      title: 'Entrez votre adresse',
      description: 'Saisissez votre adresse ou utilisez la géolocalisation pour trouver des professionnels près de chez vous.'
    },
    {
      icon: 'fas fa-building',
      title: 'Choisissez une entreprise',
      description: 'Comparez les entreprises de nettoyage certifiées, leurs tarifs, disponibilités et avis clients.'
    },
    {
      icon: 'fas fa-calendar-check',
      title: 'Réservez en ligne',
      description: 'Sélectionnez votre créneau, le type de prestation et confirmez en quelques secondes.'
    },
    {
      icon: 'fas fa-undo-alt',
      title: 'Intervention garantie',
      description: 'Un agent qualifié intervient à l\'heure prévue. Satisfaction 100% garantie ou on revient gratuitement.'
    }
  ];

  // Simplified core features (merged with comparison)
  coreFeatures = [
    {
      icon: 'fas fa-shield-alt',
      title: 'Entreprises certifiées',
      description: 'Chaque partenaire est vérifié : Kbis, assurance RC Pro, références contrôlées.'
    },
    {
      icon: 'fas fa-bolt',
      title: 'Réservation en 60 sec',
      description: 'Disponibilités en temps réel. Confirmez sans appel ni devis.'
    },
    {
      icon: 'fas fa-undo-alt',
      title: 'Satisfaction garantie',
      description: 'Pas satisfait ? On repasse gratuitement ou vous êtes remboursé.'
    },
    {
      icon: 'fas fa-leaf',
      title: 'Produits éco‑responsables',
      description: 'Des produits certifiés écologiques, sûrs pour votre famille.'
    }
  ];

  stats = [
    { value: '1000+', rawValue: 1000, suffix: '+', label: 'ménages nettoyés' },
    { value: '200+',    rawValue: 200,   suffix: '+', label: 'entreprises partenaires' },
    { value: '4,8',     rawValue: 48,    suffix: '',  label: 'note moyenne / 5' },
    { value: '98%',     rawValue: 98,    suffix: '%', label: 'clients satisfaits' }
  ];

  testimonials = [
    {
      name: 'Marie L.',
      city: 'Lyon',
      initials: 'ML',
      service: 'Ménage régulier – 3h',
      rating: 5,
      text: 'Je réserve NetProxi chaque semaine depuis 4 mois. Équipe sérieuse, toujours à l\'heure, et vraiment minutieuse. Je recommande à 100% !'
    },
    {
      name: 'Thomas B.',
      city: 'Paris',
      initials: 'TB',
      service: 'Nettoyage de fin de chantier',
      rating: 5,
      text: 'Après des travaux, l\'appartement était dans un état catastrophique. Intervention rapide, résultat bluffant. Rapport qualité/prix imbattable.'
    },
    {
      name: 'Sophie M.',
      city: 'Marseille',
      initials: 'SM',
      service: 'Grand ménage de printemps',
      rating: 5,
      text: 'Réservation super simple, professionnel ponctuel et efficace. L\'appartement n\'avait jamais été aussi propre. Merci NetProxi !'
    }
  ];

  comparisonRows = [
    { label: 'Personnel vérifié & assuré',      classic: false, net: true },
    { label: 'Réservation en ligne 24h/24',       classic: false, net: true },
    { label: 'Gestion complète de l\'intervention', classic: false, net: true },
    { label: 'Satisfaction garantie ou remboursé', classic: false, net: true },
    { label: 'Support dédié',                     classic: false, net: true },
    { label: 'Facturation automatique',           classic: false, net: true },
  ];

  proBenefits = [
    { icon: 'fas fa-paper-plane',  text: 'Nouvelles missions automatiques' },
    { icon: 'fas fa-users',        text: 'Gestion des employés simplifiée' },
    { icon: 'fas fa-calendar-alt', text: 'Planning optimisé en temps réel' },
    { icon: 'fas fa-chart-line',   text: 'Tableau de bord et statistiques' },
    { icon: 'fas fa-file-invoice', text: 'Facturation automatisée' },
  ];

  stars(n: number): number[] {
    return Array(n).fill(0);
  }
}