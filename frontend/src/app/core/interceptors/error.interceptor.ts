import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = getErrorMessage(error);
      if (message) {
        notificationService.error(message);
      }
      return throwError(() => error);
    }),
  );
};

function getErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Network error: unable to reach the server.';
  }

  const backendMessage =
    error.error?.message ??
    error.error?.error ??
    (Array.isArray(error.error?.errors) ? error.error.errors.join(', ') : null);

  if (typeof backendMessage === 'string' && backendMessage.trim()) {
    return backendMessage;
  }

 switch (error.status) {
  case 400:
    return 'Requête invalide. Veuillez vérifier les informations saisies.';
  case 401:
    return 'Échec de l’authentification. Veuillez vous reconnecter.';
  case 403:
    return 'Vous n’êtes pas autorisé à effectuer cette action.';
  case 404:
    return 'La ressource demandée est introuvable.';
  case 500:
    return 'Erreur du serveur. Veuillez réessayer plus tard.';
  default:
    return error.message || 'Une erreur inattendue est survenue.';
}
}
