import { createReducer, on } from '@ngrx/store';
import { EmployeeState, initialEmployeeState } from './employee.state';
import * as EmployeeActions from './employee.actions';

export const employeeReducer = createReducer(
  initialEmployeeState,

  // Load Profile
  on(EmployeeActions.loadEmployeeProfile, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(EmployeeActions.loadEmployeeProfileSuccess, (state, { profile }) => ({
    ...state,
    profile,
    loading: false,
    lastUpdated: new Date().toISOString()
  })),
  on(EmployeeActions.loadEmployeeProfileFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),

  // Update Profile
  on(EmployeeActions.updateEmployeeProfile, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(EmployeeActions.updateEmployeeProfileSuccess, (state, { profile }) => ({
    ...state,
    profile,
    loading: false
  })),
  on(EmployeeActions.updateEmployeeProfileFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),

  // Load Tasks
  on(EmployeeActions.loadEmployeeTasks, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(EmployeeActions.loadEmployeeTasksSuccess, (state, { tasks }) => ({
    ...state,
    tasks,
    loading: false,
    lastUpdated: new Date().toISOString()
  })),
  on(EmployeeActions.loadEmployeeTasksFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),

  // Today's Tasks
  on(EmployeeActions.loadTodayTasks, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(EmployeeActions.loadTodayTasksSuccess, (state, { tasks }) => ({
    ...state,
    todayTasks: tasks,
    loading: false
  })),
  on(EmployeeActions.loadTodayTasksFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),

  // Upcoming Tasks
  on(EmployeeActions.loadUpcomingTasks, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(EmployeeActions.loadUpcomingTasksSuccess, (state, { tasks }) => ({
    ...state,
    upcomingTasks: tasks,
    loading: false
  })),
  on(EmployeeActions.loadUpcomingTasksFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),

  // Completed Tasks
  on(EmployeeActions.loadCompletedTasks, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(EmployeeActions.loadCompletedTasksSuccess, (state, { tasks }) => ({
    ...state,
    completedTasks: tasks,
    loading: false
  })),
  on(EmployeeActions.loadCompletedTasksFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),

  // Update Task Status
  on(EmployeeActions.updateTaskStatus, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(EmployeeActions.updateTaskStatusSuccess, (state, { task }) => ({
    ...state,
    tasks: state.tasks.map(t => t.id === task.id ? task : t),
    loading: false,
    lastUpdated: new Date().toISOString()
  })),
  on(EmployeeActions.updateTaskStatusFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),

  // Task real-time updates
  on(EmployeeActions.taskAssigned, (state, { task }) => ({
    ...state,
    tasks: [...state.tasks, task]
  })),
  on(EmployeeActions.taskUpdated, (state, { task }) => ({
    ...state,
    tasks: state.tasks.map(t => t.id === task.id ? task : t)
  })),
  on(EmployeeActions.taskCancelled, (state, { taskId }) => ({
    ...state,
    tasks: state.tasks.filter(t => t.id !== taskId)
  })),

  // Load Notifications
  on(EmployeeActions.loadNotifications, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(EmployeeActions.loadNotificationsSuccess, (state, { notifications }) => ({
    ...state,
    notifications,
    loading: false,
    lastUpdated: new Date().toISOString()
  })),
  on(EmployeeActions.loadNotificationsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),

  // Mark Notification as Read
  on(EmployeeActions.markNotificationAsRead, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(EmployeeActions.markNotificationAsReadSuccess, (state, { notificationId }) => ({
    ...state,
    notifications: state.notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ),
    loading: false
  })),
  on(EmployeeActions.markNotificationAsReadFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),

  // Mark All Notifications as Read
  on(EmployeeActions.markAllNotificationsAsRead, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(EmployeeActions.markAllNotificationsAsReadSuccess, (state) => ({
    ...state,
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    loading: false
  })),
  on(EmployeeActions.markAllNotificationsAsReadFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),

  // Clear All Notifications
  on(EmployeeActions.clearAllNotifications, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(EmployeeActions.clearAllNotificationsSuccess, (state) => ({
    ...state,
    notifications: [],
    loading: false
  })),
  on(EmployeeActions.clearAllNotificationsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),

  // Add Notification
  on(EmployeeActions.addNotification, (state, { notification }) => ({
    ...state,
    notifications: [notification, ...state.notifications]
  })),

  /*
  on(EmployeeActions.setEmployeeLoading, (state, { loading }) => ({
    ...state,
    loading
  })),

  // Clear Errors
  on(EmployeeActions.clearEmployeeErrors, (state) => ({
    ...state,
    error: null
  }))*/
);

export function reducer(state: EmployeeState | undefined, action: any) {
  return employeeReducer(state, action);
}