package com.shawilTech.netproxi.controller;

import com.shawilTech.netproxi.dto.*;
import com.shawilTech.netproxi.service.EmployeeDashboardService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employee")
@RequiredArgsConstructor
public class EmployeeDashboardController {

    private final EmployeeDashboardService dashboardService;

    //  1. Profile
    @GetMapping("/profile")
    public ResponseEntity<EmployeeProfileResponseDto> getEmployeeProfile() {
        return ResponseEntity.ok(dashboardService.getProfile());
    }

    //  2. Update profile
    @PatchMapping("/profile")
    public ResponseEntity<EmployeeProfileResponseDto> updateEmployeeProfile(
            @RequestBody UpdateEmployeeProfileDto dto) {
        return ResponseEntity.ok(dashboardService.updateProfile(dto));
    }

    // 3. Tasks
    @GetMapping("/tasks")
    public ResponseEntity<List<EmployeeTaskResponseDto>> getEmployeeTasks() {
        return ResponseEntity.ok(dashboardService.getTasks());
    }

    //  4. Today tasks
    @GetMapping("/tasks/today")
    public ResponseEntity<List<EmployeeTaskResponseDto>> getTodayTasks() {
        return ResponseEntity.ok(dashboardService.getTodayTasks());
    }

    //  5. Upcoming tasks
    @GetMapping("/tasks/upcoming")
    public ResponseEntity<List<EmployeeTaskResponseDto>> getUpcomingTasks() {
        return ResponseEntity.ok(dashboardService.getUpcomingTasks());
    }

    // 6. Completed tasks
    @GetMapping("/tasks/completed")
    public ResponseEntity<List<EmployeeTaskResponseDto>> getCompletedTasks(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(dashboardService.getCompletedTasks(days));
    }

    // 7. Update task status
    @PatchMapping("/tasks/{taskId}/status")
    public ResponseEntity<EmployeeTaskResponseDto> updateTaskStatus(
            @PathVariable java.util.UUID taskId,
            @RequestBody UpdateTaskStatusDto dto) {
        return ResponseEntity.ok(dashboardService.updateTaskStatus(taskId, dto));
    }

    //  8. Task details
    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<EmployeeTaskResponseDto> getTaskDetails(
            @PathVariable java.util.UUID taskId) {
        return ResponseEntity.ok(dashboardService.getTaskDetails(taskId));
    }

    // 9. Notifications
    @GetMapping("/notifications")
    public ResponseEntity<List<EmployeeNotificationResponseDto>> getNotifications(
            @RequestParam(defaultValue = "false") boolean unreadOnly) {
        return ResponseEntity.ok(dashboardService.getNotifications(unreadOnly));
    }

    //  10. Mark one as read
    @PatchMapping("/notifications/{notificationId}/read")
    public ResponseEntity<Void> markNotificationAsRead(
            @PathVariable java.util.UUID notificationId) {
        dashboardService.markNotificationAsRead(notificationId);
        return ResponseEntity.ok().build();
    }

    // 11. Mark all read
    @PostMapping("/notifications/mark-all-read")
    public ResponseEntity<Void> markAllNotificationsAsRead() {
        dashboardService.markAllNotificationsAsRead();
        return ResponseEntity.ok().build();
    }

    //  12. Clear notifications
    @DeleteMapping("/notifications")
    public ResponseEntity<Void> clearAllNotifications() {
        dashboardService.clearAllNotifications();
        return ResponseEntity.ok().build();
    }

    //  13. Stats
    @GetMapping("/stats")
    public ResponseEntity<EmployeeStatsResponseDto> getEmployeeStats(
            @RequestParam(defaultValue = "monthly") String period) {
        return ResponseEntity.ok(dashboardService.getStats(period));
    }

    // 14. Schedule
    @GetMapping("/schedule")
    public ResponseEntity<List<EmployeeScheduleResponseDto>> getEmployeeSchedule(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(dashboardService.getSchedule(startDate, endDate));
    }

    //  15. Availability
    @PatchMapping("/availability")
    public ResponseEntity<Void> updateAvailability(
            @RequestBody UpdateAvailabilityDto dto) {
        dashboardService.updateAvailability(dto);
        return ResponseEntity.ok().build();
    }
}