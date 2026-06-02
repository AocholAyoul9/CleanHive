import { createSelector, createFeatureSelector } from '@ngrx/store';
import { EmployeeState } from './employee.state';

export const selectEmployeeState = createFeatureSelector<EmployeeState>('employee');

// Basic selectors
export const selectEmployeeProfile = createSelector(
  selectEmployeeState,
  (state) => state?.profile ?? null
);

export const selectEmployeeTasks = createSelector(
  selectEmployeeState,
  (state) => state?.tasks ?? []
);

export const selectEmployeeNotifications = createSelector(
  selectEmployeeState,
  (state) => state?.notifications ?? []
);

export const selectEmployeeLoading = createSelector(
  selectEmployeeState,
  (state) => state?.loading ?? false
);

export const selectEmployeeError = createSelector(
  selectEmployeeState,
  (state) => state.error
);

export const selectEmployeeLastUpdated = createSelector(
  selectEmployeeState,
  (state) => state.lastUpdated
);

// Derived selectors
export const selectTodayTasks = createSelector(
  selectEmployeeTasks,
  (tasks) => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.startTime);
      return taskDate >= todayStart && taskDate < todayEnd;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }
);

export const selectUpcomingTasks = createSelector(
  selectEmployeeTasks,
  (tasks) => {
    const now = new Date();
    return tasks.filter(task => {
      const taskDate = new Date(task.startTime);
      return taskDate > now && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }
);

export const selectCompletedTasks = createSelector(
  selectEmployeeTasks,
  (tasks) => tasks
    .filter(task => task.status === 'COMPLETED')
    .sort((a, b) => new Date(b.endTime || b.startTime).getTime() - new Date(a.endTime || a.startTime).getTime())
);

export const selectTasksByStatus = (status: string) => createSelector(
  selectEmployeeTasks,
  (tasks) => tasks.filter(task => task.status === status)
);

export const selectUnreadNotifications = createSelector(
  selectEmployeeNotifications,
  (notifications) => notifications.filter(notification => !notification.read)
);

export const selectUnreadNotificationsCount = createSelector(
  selectUnreadNotifications,
  (notifications) => notifications.length
);

export const selectNotificationsByType = (type: string) => createSelector(
  selectEmployeeNotifications,
  (notifications) => notifications.filter(notification => notification.type === type)
);

// Stats selectors
export const selectEmployeeStats = createSelector(
  selectEmployeeTasks,
  (tasks) => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.startTime);
      return taskDate >= todayStart;
    }).length;

    const upcomingTasks = tasks.filter(task => {
      const taskDate = new Date(task.startTime);
      return taskDate > today && task.status !== 'COMPLETED';
    }).length;

    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;

    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    // Calculate average rating from completed tasks with ratings
    const ratedTasks = tasks.filter(task => task.status === 'COMPLETED' && task.rating);
    const averageRating = ratedTasks.length > 0
      ? ratedTasks.reduce((sum, task) => sum + (task.rating || 0), 0) / ratedTasks.length
      : 0;

    // Calculate earnings (you would need to add price to tasks)
    const completedWithEarnings = tasks.filter(task => 
      task.status === 'COMPLETED' //&& task['price']
    );
    const totalEarnings = completedWithEarnings.reduce((sum, task) => 
      sum +  (/*task['price'] ||*/ 0), 0
    );

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyEarnings = completedWithEarnings
      .filter(task => new Date(task.endTime || task.startTime) >= thisMonthStart)
      .reduce((sum, task) => sum + (/*task['price'] ||*/ 0), 0);

    return {
      todayTasks,
      upcomingTasks,
      completedTasks,
      completionRate,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalEarnings,
      monthlyEarnings,
      totalTasks,
      ratedTasks: ratedTasks.length
    };
  }
);

// Task selectors for specific views
export const selectTaskById = (taskId: string) => createSelector(
  selectEmployeeTasks,
  (tasks) => tasks.find(task => task.id === taskId)
);

export const selectTasksForDate = (date: Date) => createSelector(
  selectEmployeeTasks,
  (tasks) => {
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    return tasks.filter(task => {
      const taskDate = new Date(task.startTime);
      return taskDate >= dateStart && taskDate < dateEnd;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }
);

export const selectTasksByPriority = (priority: string) => createSelector(
  selectEmployeeTasks,
  (tasks) => tasks.filter(task => task.priority === priority)
);