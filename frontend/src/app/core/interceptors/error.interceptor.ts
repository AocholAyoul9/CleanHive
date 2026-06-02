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
      return 'Bad request. Please verify your input.';
    case 401:
      return 'Authentication failed. Please sign in again.';
    case 403:
      return 'You are not authorized to perform this action.';
    case 404:
      return 'Requested resource was not found.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
}
