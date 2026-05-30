import { Routes } from '@angular/router';
import { ProSignupComponent } from './features/pro-signup/pro-signup.component';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/components/landing/landing.component').then((m) => m.LandingComponent), pathMatch: 'full' },
  {
    path: 'companies',
    loadChildren: () =>
      import('./features/companies/companies.routes').then(
        (m) => m.companiesRoutes
      ),
  },

  { path: 'nearby', loadComponent: () => import('./features/companies/pages/nearby-companies/nearby-companies.component').then((m) => m.NearbyCompaniesComponent) },

  {
    path: 'company/:id',
    loadComponent: () =>
      import('./features/companies/pages/company-detail/company-detail.component').then(
        (m) => m.CompanyDetailComponent
      ),
  },
  
      { path: 'pro', component: ProSignupComponent },
  
  { path: 'client-signup', loadComponent: () => import('./features/auth/pages/register/register.component').then((m) => m.RegisterPageComponent) },
  { path: '', loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes) },
  { path: '', loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes) },
  { path: '**', redirectTo: '' },
];
