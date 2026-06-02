package com.shawilTech.netproxi.service;

import com.shawilTech.netproxi.dto.*;
import com.shawilTech.netproxi.entity.*;
import com.shawilTech.netproxi.repository.*;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeDashboardService {

    private final EmployeeRepository employeeRepository;
    private final BookingRepository bookingRepository;
    private final NotificationRepository notificationRepository;

    // ---------------- HELPER ----------------

    private Employee getCurrentEmployee() {
        String username = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return employeeRepository.findByEmail(username)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
    }

    // ---------------- PROFILE ----------------

    @Transactional(readOnly = true)
    public EmployeeProfileResponseDto getProfile() {
        Employee employee = getCurrentEmployee();

        return EmployeeProfileResponseDto.builder()
                .id(employee.getId())
                .name(employee.getName())
                .email(employee.getEmail())
                .phone(employee.getPhone())
                .address(employee.getAddress())
                .companyId(employee.getCompany().getId())
                .companyName(employee.getCompany().getName())
                .isAvailable(employee.isAvailable())
                .joinDate(employee.getCreatedAt() != null ? employee.getCreatedAt().toLocalDate().toString() : null)
                .build();
    }

    @Transactional
    public EmployeeProfileResponseDto updateProfile(UpdateEmployeeProfileDto dto) {
        Employee employee = getCurrentEmployee();
        if (dto.getName() != null) employee.setName(dto.getName());
        if (dto.getPhone() != null) employee.setPhone(dto.getPhone());
        if (dto.getAddress() != null) employee.setAddress(dto.getAddress());
        if (dto.getIsAvailable() != null) employee.setAvailable(dto.getIsAvailable());
        Employee updated = employeeRepository.save(employee);
        return getProfile();
    }

    // ---------------- TASKS ----------------

    @Transactional(readOnly = true)
    public List<EmployeeTaskResponseDto> getTasks() {
        Employee employee = getCurrentEmployee();

        List<Booking> tasks = bookingRepository.findByEmployeeId(employee.getId());

        return tasks.stream()
                .map(this::convertToTaskDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmployeeTaskResponseDto> getTodayTasks() {
        Employee employee = getCurrentEmployee();
        LocalDate today = LocalDate.now();

        return bookingRepository.findByEmployeeId(employee.getId()).stream()
                .filter(b -> b.getStartTime().toLocalDate().isEqual(today))
                .map(this::convertToTaskDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmployeeTaskResponseDto> getUpcomingTasks() {
        Employee employee = getCurrentEmployee();
        LocalDateTime now = LocalDateTime.now();

        return bookingRepository.findByEmployeeId(employee.getId()).stream()
                .filter(b -> b.getStartTime().isAfter(now))
                .filter(b -> b.getStatus() != BookingStatus.COMPLETED)
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .map(this::convertToTaskDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EmployeeTaskResponseDto> getCompletedTasks(int days) {
        Employee employee = getCurrentEmployee();
        LocalDate cutoff = LocalDate.now().minusDays(days);

        return bookingRepository.findByEmployeeId(employee.getId()).stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .filter(b -> b.getEndTime() != null && b.getEndTime().toLocalDate().isAfter(cutoff))
                .map(this::convertToTaskDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeTaskResponseDto getTaskDetails(UUID taskId) {
        Employee employee = getCurrentEmployee();
        Booking booking = bookingRepository.findByIdAndEmployeeId(taskId, employee.getId())
                .orElseThrow(() -> new RuntimeException("Task not found"));

        return convertToTaskDto(booking);
    }

    @Transactional
    public EmployeeTaskResponseDto updateTaskStatus(UUID taskId, UpdateTaskStatusDto dto) {
        Employee employee = getCurrentEmployee();

        Booking booking = bookingRepository.findByIdAndEmployeeId(taskId, employee.getId())
                .orElseThrow(() -> new RuntimeException("Task not found"));

        booking.setStatus(BookingStatus.valueOf(dto.getStatus()));
        if (dto.getStartTime() != null) booking.setActualStartTime(LocalDateTime.parse(dto.getStartTime()));
        if (dto.getEndTime() != null) booking.setActualEndTime(LocalDateTime.parse(dto.getEndTime()));

        Booking updated = bookingRepository.save(booking);
        createStatusChangeNotification(employee, updated);

        return convertToTaskDto(updated);
    }

    // ---------------- NOTIFICATIONS ----------------

    @Transactional(readOnly = true)
    public List<EmployeeNotificationResponseDto> getNotifications(boolean unreadOnly) {
        Employee employee = getCurrentEmployee();

        return notificationRepository.findByEmployeeId(employee.getId()).stream()
                .filter(n -> !unreadOnly || !n.isRead())
                .map(this::convertToNotificationDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markNotificationAsRead(UUID notificationId) {
        Employee employee = getCurrentEmployee();
        Notification n = notificationRepository.findByIdAndEmployeeId(notificationId, employee.getId())
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllNotificationsAsRead() {
        Employee employee = getCurrentEmployee();
        notificationRepository.findByEmployeeId(employee.getId()).forEach(n -> n.setRead(true));
    }

    @Transactional
    public void clearAllNotifications() {
        Employee employee = getCurrentEmployee();
        notificationRepository.findByEmployeeId(employee.getId())
                .forEach(notificationRepository::delete);
    }

    // ---------------- STATS ----------------

    @Transactional(readOnly = true)
    public EmployeeStatsResponseDto getStats(String period) {
        Employee employee = getCurrentEmployee();
        List<Booking> tasks = bookingRepository.findByEmployeeId(employee.getId());

        long total = tasks.size();
        long completed = tasks.stream().filter(b -> b.getStatus() == BookingStatus.COMPLETED).count();
        double avgRating = tasks.stream().filter(b -> b.getRating() != null)
                .mapToInt(Booking::getRating).average().orElse(0);

        return EmployeeStatsResponseDto.builder()
                .totalTasks((int) total)
                .completedTasks((int) completed)
                .averageRating(avgRating)
                .period(period)
                .build();
    }

    // ---------------- SCHEDULE ----------------

    @Transactional(readOnly = true)
    public List<EmployeeScheduleResponseDto> getSchedule(String startDate, String endDate) {
        Employee employee = getCurrentEmployee();
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now();
        LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now().plusDays(7);

        return bookingRepository.findByEmployeeId(employee.getId()).stream()
                .filter(b -> !b.getStartTime().toLocalDate().isBefore(start) &&
                             !b.getStartTime().toLocalDate().isAfter(end))
                .map(b -> EmployeeScheduleResponseDto.builder()
                        .serviceName(b.getService() != null ? b.getService().getName() : "Unknown")
                        .status(b.getStatus().name())
                        .startTime(b.getStartTime().toString())
                        .endTime(b.getEndTime() != null ? b.getEndTime().toString() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateAvailability(UpdateAvailabilityDto dto) {
        Employee employee = getCurrentEmployee();
        employee.setAvailable(dto.getAvailable());
        employeeRepository.save(employee);
    }

    // ---------------- INTERNAL HELPERS ----------------

    private EmployeeTaskResponseDto convertToTaskDto(Booking booking) {
        return EmployeeTaskResponseDto.builder()
                .id(booking.getId())
                .serviceName(booking.getService() != null ? booking.getService().getName() : "Unknown")
                .price(booking.getService() != null ? booking.getService().getBasePrice() : 0.0)
                .status(booking.getStatus().name())
                .startTime(booking.getStartTime().toString())
                .endTime(booking.getEndTime() != null ? booking.getEndTime().toString() : null)
                .build();
    }

    private EmployeeNotificationResponseDto convertToNotificationDto(Notification n) {
        return EmployeeNotificationResponseDto.builder()
                .id(n.getId())
                .employeeId(n.getEmployee().getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .read(n.isRead())
                .createdAt(n.getCreatedAt().toString())
                .actionUrl(n.getActionUrl())
                .build();
    }

    private void createStatusChangeNotification(Employee employee, Booking booking) {
        Notification notification = Notification.builder()
                .employee(employee)
                .title("Task status updated")
                .message("Task status changed to " + booking.getStatus())
                .type("TASK_UPDATED")
                .isRead(false)
                .metadata("{\"taskId\":\"" + booking.getId() + "\"}")
                .actionUrl("/employee/tasks/" + booking.getId())
                .build();

        notificationRepository.save(notification);
    }
}
