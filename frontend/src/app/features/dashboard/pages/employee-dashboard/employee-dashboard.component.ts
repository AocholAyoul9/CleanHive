import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription, interval, of } from 'rxjs';

import * as EmployeeSelectors from '../../../employee/state/employee.selectors';
import * as EmployeeActions from '../../../employee/state/employee.actions';
import { EmployeeTask, EmployeeNotification } from '../../../employee/models/employee.model';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.scss']
})
export class EmployeeDashboardComponent implements OnInit, OnDestroy {
  // Observables
  employeeProfile$: Observable<any>;
  todayTasks$: Observable<EmployeeTask[]>;
  upcomingTasks$: Observable<EmployeeTask[]>;
  completedTasks$: Observable<EmployeeTask[]>;
  notifications$: Observable<EmployeeNotification[]>;
  unreadNotificationsCount$: Observable<number>;
  loading$: Observable<boolean>;
  stats$: Observable<any>;

  // Local state
  activeTab: 'today' | 'upcoming' | 'completed' | 'notifications' = 'today';
  selectedTask: EmployeeTask | null = null;
  showTaskModal = false;
  showNotificationModal = false;
  selectedNotification: EmployeeNotification | null = null;
  currentTime = signal(new Date());

  // Subscriptions
  private subscriptions = new Subscription();
  private timeInterval!: any;

  constructor(private store: Store) {
    // Initialize observables
   this.employeeProfile$ = this.store.select(EmployeeSelectors.selectEmployeeProfile);
    this.todayTasks$ = this.store.select(EmployeeSelectors.selectTodayTasks);
    this.upcomingTasks$ = this.store.select(EmployeeSelectors.selectUpcomingTasks);
    this.completedTasks$ = this.store.select(EmployeeSelectors.selectCompletedTasks);
    this.notifications$ = this.store.select(EmployeeSelectors.selectUnreadNotifications);
    this.unreadNotificationsCount$ = this.store.select(EmployeeSelectors.selectUnreadNotificationsCount);
    this.loading$ = this.store.select(EmployeeSelectors.selectEmployeeLoading);
    this.stats$ = this.store.select(EmployeeSelectors.selectEmployeeStats);
/*
  this.employeeProfile$ = of(null);
  this.todayTasks$ = of([]);
  this.upcomingTasks$ = of([]);
  this.completedTasks$ = of([]);
  this.notifications$ = of([]);
  this.unreadNotificationsCount$ = of(0);
  this.loading$ = of(false);
  this.stats$ = of({});*/
  }

  ngOnInit(): void {
    // Load employee data
    this.store.dispatch(EmployeeActions.loadEmployeeProfile());
    this.store.dispatch(EmployeeActions.loadEmployeeTasks());
    this.store.dispatch(EmployeeActions.loadNotifications());

    // Update current time every minute
    this.timeInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 60000);

    // Auto-refresh tasks every 5 minutes
    this.subscriptions.add(
      interval(300000).subscribe(() => {
        this.store.dispatch(EmployeeActions.loadEmployeeTasks());
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  // Tab navigation
  setActiveTab(tab: 'today' | 'upcoming' | 'completed' | 'notifications'): void {
    this.activeTab = tab;
  }

  // Task actions
  viewTaskDetails(task: EmployeeTask): void {
    this.selectedTask = task;
    this.showTaskModal = true;
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.selectedTask = null;
  }

  startTask(task: EmployeeTask): void {
    this.store.dispatch(EmployeeActions.updateTaskStatus({
      taskId: task.id,
      status: 'IN_PROGRESS',
      startTime: new Date().toISOString()
    }));
  }

  completeTask(task: EmployeeTask): void {
    this.store.dispatch(EmployeeActions.updateTaskStatus({
      taskId: task.id,
      status: 'COMPLETED',
      endTime: new Date().toISOString()
    }));
    this.closeTaskModal();
  }

  // Notification actions
  viewNotification(notification: EmployeeNotification): void {
    this.selectedNotification = notification;
    this.showNotificationModal = true;
    
    // Mark as read
    if (!notification.read) {
      this.store.dispatch(EmployeeActions.markNotificationAsRead({
        notificationId: notification.id
      }));
    }
  }

  closeNotificationModal(): void {
    this.showNotificationModal = false;
    this.selectedNotification = null;
  }

  markAllAsRead(): void {
    this.store.dispatch(EmployeeActions.markAllNotificationsAsRead());
  }

  clearAllNotifications(): void {
    this.store.dispatch(EmployeeActions.clearAllNotifications());
  }

  // Utility methods
  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeUntil(startTime: string): string {
    const now = new Date();
    const start = new Date(startTime);
    const diffMs = start.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) return 'En retard';
    if (diffHours === 0) return 'Maintenant';
    if (diffHours < 24) return `Dans ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  }

  getTaskStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-purple-100 text-purple-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getTaskStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'En attente',
      'CONFIRMED': 'Confirmé',
      'IN_PROGRESS': 'En cours',
      'COMPLETED': 'Terminé',
      'CANCELLED': 'Annulé'
    };
    return labels[status] || status;
  }


  getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    'TASK_ASSIGNED': 'fas fa-tasks',
    'TASK_UPDATED': 'fas fa-edit',
    'TASK_CANCELLED': 'fas fa-times-circle',
    'SCHEDULE_CHANGED': 'fas fa-calendar-alt',
    'SYSTEM': 'fas fa-cog',
    'URGENT': 'fas fa-exclamation-triangle'
  };
  return icons[type] || 'fas fa-bell';
}

getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'TASK_ASSIGNED': 'Tâche assignée',
    'TASK_UPDATED': 'Tâche mise à jour',
    'TASK_CANCELLED': 'Tâche annulée',
    'SCHEDULE_CHANGED': 'Planning modifié',
    'SYSTEM': 'Système',
    'URGENT': 'Urgent'
  };
  return labels[type] || type;
}
}