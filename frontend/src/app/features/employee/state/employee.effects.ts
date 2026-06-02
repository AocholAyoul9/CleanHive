import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, tap, exhaustMap } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import * as EmployeeActions from './employee.actions';
import { ApiService } from '../../../core/api.service';
import { clearTokens } from '../../../features/auth/utils/token-storage';
import { NotificationService } from '../../../core/services/notification.service';

@Injectable()
export class EmployeeEffects {
loadEmployeeProfile$;
updateEmployeeProfile$;
loadEmployeeTasks$;
loadTodayTasks$;
loadUpcomingTasks$;
loadCompletedTasks$;
updateTaskStatus$;
loadTaskDetails$;
loadNotifications$;
markNotificationAsRead$;
markAllNotificationsAsRead$;
clearAllNotifications$;
loadEmployeeStats$;
loadEmployeeSchedule$;
updateAvailability$;
loadEmployeeDataAfterProfileSuccess$;
refreshAfterTaskUpdate$;
handleErrors$;
handleSuccesses$;
handleLogout$;
startTask$;
completeTask$;
filterTasks$;
refreshData$;
initializeEmployeeDashboard$;
  constructor(
    private actions$: Actions,
    private apiService: ApiService,
    private store: Store,
    private notificationService: NotificationService,
  ) {

  // Charger le profil de l'employé
  this.loadEmployeeProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.loadEmployeeProfile),
      exhaustMap(() =>
        this.apiService.getEmployeeProfile().pipe(
          map(profile => EmployeeActions.loadEmployeeProfileSuccess({ profile })),
          catchError(error => of(EmployeeActions.loadEmployeeProfileFailure({ 
            error: error.message || 'Échec du chargement du profil' 
          })))
        )
      )
    )
  );

  // Mettre à jour le profil de l'employé
  this.updateEmployeeProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.updateEmployeeProfile),
      mergeMap(({ profile }) =>
        this.apiService.updateEmployeeProfile(profile).pipe(
          map(updatedProfile => EmployeeActions.updateEmployeeProfileSuccess({ profile: updatedProfile })),
          catchError(error => of(EmployeeActions.updateEmployeeProfileFailure({ 
            error: error.message || 'Échec de la mise à jour du profil' 
          })))
        )
      )
    )
  );

  // Charger les tâches de l'employé
  this.loadEmployeeTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.loadEmployeeTasks),
      mergeMap(() =>
        this.apiService.getEmployeeTasks().pipe(
          map(tasks => EmployeeActions.loadEmployeeTasksSuccess({ tasks })),
          catchError(error => of(EmployeeActions.loadEmployeeTasksFailure({ 
            error: error.message || 'Échec du chargement des tâches' 
          })))
        )
      )
    )
  );

  // Charger les tâches d'aujourd'hui
  this.loadTodayTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.loadTodayTasks),
      mergeMap(() =>
        this.apiService.getEmployeeTodayTasks().pipe(
          map(tasks => EmployeeActions.loadTodayTasksSuccess({ tasks })),
          catchError(error => of(EmployeeActions.loadTodayTasksFailure({ 
            error: error.message || 'Échec du chargement des tâches d\'aujourd\'hui' 
          })))
        )
      )
    )
  );

  // Charger les tâches à venir
  this.loadUpcomingTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.loadUpcomingTasks),
      mergeMap(() =>
        this.apiService.getEmployeeUpcomingTasks().pipe(
          map(tasks => EmployeeActions.loadUpcomingTasksSuccess({ tasks })),
          catchError(error => of(EmployeeActions.loadUpcomingTasksFailure({ 
            error: error.message || 'Échec du chargement des tâches à venir' 
          })))
        )
      )
    )
  );

  // Charger les tâches terminées
  this.loadCompletedTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.loadCompletedTasks),
      mergeMap(({ days }) =>
        this.apiService.getEmployeeCompletedTasks(days).pipe(
          map(tasks => EmployeeActions.loadCompletedTasksSuccess({ tasks })),
          catchError(error => of(EmployeeActions.loadCompletedTasksFailure({ 
            error: error.message || 'Échec du chargement des tâches terminées' 
          })))
        )
      )
    )
  );

  // Mettre à jour le statut d'une tâche
  this.updateTaskStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.updateTaskStatus),
      mergeMap(({ taskId, status, startTime, endTime, notes }) =>
        this.apiService.updateEmployeeTaskStatus(taskId, status, { startTime, endTime, notes }).pipe(
          map(task => EmployeeActions.updateTaskStatusSuccess({ task })),
          catchError(error => of(EmployeeActions.updateTaskStatusFailure({ 
            error: error.message || 'Échec de la mise à jour du statut' 
          })))
        )
      )
    )
  );

  // Charger les détails d'une tâche
  this.loadTaskDetails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.loadTaskDetails),
      mergeMap(({ taskId }) =>
        this.apiService.getEmployeeTaskDetails(taskId).pipe(
          map(task => EmployeeActions.loadTaskDetailsSuccess({ task })),
          catchError(error => of(EmployeeActions.loadTaskDetailsFailure({ 
            error: error.message || 'Échec du chargement des détails de la tâche' 
          })))
        )
      )
    )
  );

  // Charger les notifications
  this.loadNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.loadNotifications),
      mergeMap(() =>
        this.apiService.getEmployeeNotifications().pipe(
          map(notifications => EmployeeActions.loadNotificationsSuccess({ notifications })),
          catchError(error => of(EmployeeActions.loadNotificationsFailure({ 
            error: error.message || 'Échec du chargement des notifications' 
          })))
        )
      )
    )
  );

  // Marquer une notification comme lue
  this.markNotificationAsRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.markNotificationAsRead),
      mergeMap(({ notificationId }) =>
        this.apiService.markEmployeeNotificationAsRead(notificationId).pipe(
          map(() => EmployeeActions.markNotificationAsReadSuccess({ notificationId })),
          catchError(error => of(EmployeeActions.markNotificationAsReadFailure({ 
            error: error.message || 'Échec du marquage de la notification' 
          })))
        )
      )
    )
  );

  // Marquer toutes les notifications comme lues
  this.markAllNotificationsAsRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.markAllNotificationsAsRead),
      mergeMap(() =>
        this.apiService.markAllEmployeeNotificationsAsRead().pipe(
          map(() => EmployeeActions.markAllNotificationsAsReadSuccess()),
          catchError(error => of(EmployeeActions.markAllNotificationsAsReadFailure({ 
            error: error.message || 'Échec du marquage des notifications' 
          })))
        )
      )
    )
  );

  // Effacer toutes les notifications
  this.clearAllNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.clearAllNotifications),
      mergeMap(() =>
        this.apiService.clearAllEmployeeNotifications().pipe(
          map(() => EmployeeActions.clearAllNotificationsSuccess()),
          catchError(error => of(EmployeeActions.clearAllNotificationsFailure({ 
            error: error.message || 'Échec de la suppression des notifications' 
          })))
        )
      )
    )
  );

  // Charger les statistiques
  this.loadEmployeeStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.loadEmployeeStats),
      mergeMap(({ period }) =>
        this.apiService.getEmployeeStats(period).pipe(
          map(stats => EmployeeActions.loadEmployeeStatsSuccess({ stats })),
          catchError(error => of(EmployeeActions.loadEmployeeStatsFailure({ 
            error: error.message || 'Échec du chargement des statistiques' 
          })))
        )
      )
    )
  );

  // Charger le planning
  this.loadEmployeeSchedule$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.loadEmployeeSchedule),
      mergeMap(({ startDate, endDate }) =>
        this.apiService.getEmployeeSchedule(startDate, endDate).pipe(
          map(schedule => EmployeeActions.loadEmployeeScheduleSuccess({ schedule })),
          catchError(error => of(EmployeeActions.loadEmployeeScheduleFailure({ 
            error: error.message || 'Échec du chargement du planning' 
          })))
        )
      )
    )
  );

  // Mettre à jour la disponibilité
  this.updateAvailability$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.updateAvailability),
      mergeMap(({ isAvailable }) =>
        this.apiService.updateEmployeeAvailability(isAvailable).pipe(
          map(() => EmployeeActions.updateAvailabilitySuccess()),
          catchError(error => of(EmployeeActions.updateAvailabilityFailure({ 
            error: error.message || 'Échec de la mise à jour de la disponibilité' 
          })))
        )
      )
    )
  );

  // Effet pour charger automatiquement les données après connexion
  this.loadEmployeeDataAfterProfileSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.loadEmployeeProfileSuccess),
      mergeMap(() => [
        EmployeeActions.loadEmployeeTasks(),
        EmployeeActions.loadNotifications(),
        EmployeeActions.loadEmployeeStats({ period: 'monthly' })
      ])
    )
  );

  // Effet pour recharger après mise à jour de statut
  this.refreshAfterTaskUpdate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.updateTaskStatusSuccess),
      mergeMap(() => [
        EmployeeActions.loadEmployeeTasks(),
        EmployeeActions.loadEmployeeStats({ period: 'monthly' })
      ])
    )
  );

  // Gestion des erreurs - afficher des notifications
  this.handleErrors$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        EmployeeActions.loadEmployeeProfileFailure,
        EmployeeActions.updateEmployeeProfileFailure,
        EmployeeActions.loadEmployeeTasksFailure,
        EmployeeActions.updateTaskStatusFailure,
        EmployeeActions.loadNotificationsFailure,
        EmployeeActions.markNotificationAsReadFailure,
        EmployeeActions.markAllNotificationsAsReadFailure,
        EmployeeActions.clearAllNotificationsFailure,
        EmployeeActions.loadEmployeeStatsFailure,
        EmployeeActions.updateAvailabilityFailure
      ),
      tap(({ error }) => {
        this.notificationService.error(error || 'Employee request failed.');
      })
    ),
    { dispatch: false }
  );

  this.handleSuccesses$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          EmployeeActions.updateEmployeeProfileSuccess,
          EmployeeActions.updateTaskStatusSuccess,
          EmployeeActions.updateAvailabilitySuccess,
        ),
        tap((action) => {
          if (action.type.includes('Update Profile Success')) {
            this.notificationService.success('Profile updated successfully.');
          } else if (action.type.includes('Update Task Status Success')) {
            this.notificationService.success('Task status updated successfully.');
          } else {
            this.notificationService.success('Availability updated successfully.');
          }
        }),
      ),
    { dispatch: false },
  );

  // Effet pour gérer la déconnexion
  this.handleLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.logoutEmployee),
      tap(() => {
        clearTokens();
      })
    ),
    { dispatch: false }
  );

  // Effet pour les actions de tâches
  this.startTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.startTask),
      mergeMap(({ taskId }) =>
        this.apiService.updateEmployeeTaskStatus(taskId, 'IN_PROGRESS', {
          startTime: new Date().toISOString()
        }).pipe(
          map(task => EmployeeActions.updateTaskStatusSuccess({ task })),
          catchError(error => of(EmployeeActions.updateTaskStatusFailure({ 
            error: error.message || 'Échec du démarrage de la tâche' 
          })))
        )
      )
    )
  );

  this.completeTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.completeTask),
      mergeMap(({ taskId, notes }) =>
        this.apiService.updateEmployeeTaskStatus(taskId, 'COMPLETED', {
          endTime: new Date().toISOString(),
          notes
        }).pipe(
          map(task => EmployeeActions.updateTaskStatusSuccess({ task })),
          catchError(error => of(EmployeeActions.updateTaskStatusFailure({ 
            error: error.message || 'Échec de la complétion de la tâche' 
          })))
        )
      )
    )
  );

  // Effet pour les filtres de tâches
  this.filterTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.filterTasks),
      mergeMap(({ status, date, priority }) =>
        this.apiService.getEmployeeTasks(status, date, priority).pipe(
          map(tasks => EmployeeActions.filterTasksSuccess({ tasks })),
          catchError(error => of(EmployeeActions.filterTasksFailure({ 
            error: error.message || 'Échec du filtrage des tâches' 
          })))
        )
      )
    )
  );

  // Effet pour recharger les données périodiquement
  this.refreshData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.refreshData),
      mergeMap(() => [
        EmployeeActions.loadEmployeeTasks(),
        EmployeeActions.loadNotifications(),
        EmployeeActions.loadEmployeeStats({ period: 'monthly' })
      ])
    )
  );

  // Effet pour le chargement initial
  this.initializeEmployeeDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EmployeeActions.initializeEmployeeDashboard),
      mergeMap(() => [
        EmployeeActions.loadEmployeeProfile(),
        EmployeeActions.loadEmployeeTasks(),
        EmployeeActions.loadNotifications(),
        EmployeeActions.loadEmployeeStats({ period: 'monthly' })
      ])
    )
  );
}}
