package com.shawilTech.netproxi.service;

import com.shawilTech.netproxi.dto.*;
import com.shawilTech.netproxi.entity.*;
import com.shawilTech.netproxi.repository.*;
import com.shawilTech.netproxi.security.JwtTokenProvider;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {

        private final EmployeeRepository employeeRepository;
        private final SubscriptionRepository subscriptionRepository;
        private final BookingRepository bookingRepository;
        private final NotificationRepository notificationRepository;
        private final JwtTokenProvider jwtProvider;
        private final UserRepository userRepository;
        private final CompanyRepository companyRepository;
        private final RoleRepository roleRepository;
        private final PasswordEncoder passwordEncoder;

        // ---------------- HELPER ----------------

        private Company getCurrentCompany() {
                String username = SecurityContextHolder.getContext()
                                .getAuthentication()
                                .getName();

                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                return user.getCompany();
        }

        // ---------------- CREATE BY COMPANY ID ----------------

        @Transactional
        public EmployeeResponseDto createEmployeeByCompanyId(UUID companyId, EmployeeRequestDto dto) {
                Company company = companyRepository.findById(companyId)
                                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));

                //subscriptionRepository.findByCompanyAndActiveTrue(company)
                              //  .orElseThrow(() -> new RuntimeException("No active subscription found"));

                if (dto.getName() == null || dto.getName().isBlank()) {
                        throw new RuntimeException("Employee name is required");
                }
                if (dto.getEmail() == null || dto.getEmail().isBlank()) {
                        throw new RuntimeException("Employee email is required");
                }
                // Make password optional - generate random if not provided
                String password = dto.getPassword();
                if (password == null || password.isBlank()) {
                        password = UUID.randomUUID().toString().substring(0, 8); // Generate simple password
                }

                Role employeeRole = roleRepository.findByName("ROLE_EMPLOYEE")
                                .orElseThrow(() -> new RuntimeException("Role ROLE_EMPLOYEE not found"));

                Employee employee = Employee.builder()
                                .name(dto.getName())
                                .email(dto.getEmail())
                                .password(passwordEncoder.encode(password))
                                .phone(dto.getPhone())
                                .address(dto.getAddress())
                                .company(company)
                                .active(true)
                                .build();

                Employee savedEmployee = employeeRepository.save(employee);

                User employeeUser = User.builder()
                                .username(dto.getName())
                                .email(dto.getEmail())
                                .password(passwordEncoder.encode(password))
                                .phone(dto.getPhone())
                                .address(dto.getAddress())
                                .enabled(true)
                                .company(company)
                                .roles(Collections.singleton(employeeRole))
                                .build();

                userRepository.save(employeeUser);

                return toResponseDto(savedEmployee);
        }

        @Transactional(readOnly = true)
        public List<EmployeeResponseDto> getEmployeesByCompanyId(UUID companyId) {
                Company company = companyRepository.findById(companyId)
                                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));

                return employeeRepository.findByCompany(company)
                                .stream()
                                .map(this::toResponseDto)
                                .collect(Collectors.toList());
        }

        @Transactional
        public void deleteEmployeeByCompanyId(UUID companyId, UUID employeeId) {
                Company company = companyRepository.findById(companyId)
                                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));

                Employee employee = employeeRepository.findByIdAndCompany(employeeId, company)
                                .orElseThrow(() -> new RuntimeException("Employee not found"));

                employeeRepository.delete(employee);
        }

        // ---------------- BASIC CRUD ----------------

        @Transactional
        public EmployeeResponseDto createEmployee(EmployeeRequestDto dto) {

                Company company = getCurrentCompany();

                subscriptionRepository.findByCompanyAndActiveTrue(company)
                                .orElseThrow(() -> new RuntimeException("No active subscription found"));

                if (dto.getName() == null || dto.getName().isBlank()) {
                        throw new RuntimeException("Employee name is required");
                }
                if (dto.getEmail() == null || dto.getEmail().isBlank()) {
                        throw new RuntimeException("Employee email is required");
                }

                String password = dto.getPassword();
                if (password == null || password.isBlank()) {
                        password = UUID.randomUUID().toString().substring(0, 8);
                }

                Employee employee = Employee.builder()
                                .name(dto.getName())
                                .email(dto.getEmail())
                                .password(passwordEncoder.encode(password))
                                .phone(dto.getPhone())
                                .address(dto.getAddress())
                                .company(company)
                                .active(true)
                                .build();

                Employee savedEmployee = employeeRepository.save(employee);

                Role employeeRole = roleRepository.findByName("ROLE_EMPLOYEE")
                                .orElseThrow(() -> new RuntimeException("Role ROLE_EMPLOYEE not found"));

                User employeeUser = User.builder()
                                .username(dto.getName())
                                .email(dto.getEmail())
                                .password(passwordEncoder.encode(password))
                                .phone(dto.getPhone())
                                .address(dto.getAddress())
                                .enabled(true)
                                .company(company)
                                .roles(Collections.singleton(employeeRole))
                                .build();

                userRepository.save(employeeUser);

                return toResponseDto(savedEmployee);
        }

        @Transactional(readOnly = true)
        public List<EmployeeResponseDto> getEmployees() {
                Company company = getCurrentCompany();

                return employeeRepository.findByCompany(company)
                                .stream()
                                .map(this::toResponseDto)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public EmployeeResponseDto getEmployeeById(UUID employeeId) {
                Company company = getCurrentCompany();

                Employee employee = employeeRepository.findByIdAndCompany(employeeId, company)
                                .orElseThrow(() -> new RuntimeException("Employee not found"));

                return toResponseDto(employee);
        }

        @Transactional
        public EmployeeResponseDto updateEmployee(UUID employeeId, EmployeeRequestDto dto) {
                Company company = getCurrentCompany();

                Employee employee = employeeRepository.findByIdAndCompany(employeeId, company)
                                .orElseThrow(() -> new RuntimeException("Employee not found"));

                employee.setName(dto.getName());
                employee.setEmail(dto.getEmail());
                employee.setPhone(dto.getPhone());
                employee.setAddress(dto.getAddress());

                return toResponseDto(employeeRepository.save(employee));
        }

        @Transactional
        public void deleteEmployee(UUID employeeId) {
                Company company = getCurrentCompany();

                Employee employee = employeeRepository.findByIdAndCompany(employeeId, company)
                                .orElseThrow(() -> new RuntimeException("Employee not found"));

                employeeRepository.delete(employee);
        }

        // ---------------- PROFILE ----------------

        @Transactional(readOnly = true)
        public EmployeeProfileResponseDto getEmployeeProfile(UUID employeeId) {
                Employee employee = employeeRepository.findById(employeeId)
                                .orElseThrow(() -> new RuntimeException("Employee not found"));

                List<Booking> tasks = bookingRepository.findByEmployeeId(employeeId);

                long completed = tasks.stream()
                                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                                .count();

                long pending = tasks.stream()
                                .filter(b -> b.getStatus() == BookingStatus.PENDING
                                                || b.getStatus() == BookingStatus.CONFIRMED)
                                .count();

                double avgRating = tasks.stream()
                                .filter(b -> b.getRating() != null)
                                .mapToInt(Booking::getRating)
                                .average()
                                .orElse(0);

                return EmployeeProfileResponseDto.builder()
                                .id(employee.getId())
                                .name(employee.getName())
                                .email(employee.getEmail())
                                .phone(employee.getPhone())
                                .companyId(employee.getCompany().getId())
                                .companyName(employee.getCompany().getName())
                                .totalTasks(tasks.size())
                                .completedTasks((int) completed)
                                .pendingTasks((int) pending)
                                .averageRating(avgRating)
                                .isAvailable(employee.isAvailable())
                                .joinDate(employee.getCreatedAt().toLocalDate().toString())
                                .build();
        }

        // ---------------- TASKS ----------------

        @Transactional(readOnly = true)
        public List<EmployeeTaskResponseDto> getEmployeeTasks(UUID employeeId) {
                return bookingRepository.findByEmployeeId(employeeId).stream()
                                .map(this::convertToTaskDto)
                                .collect(Collectors.toList());
        }

        @Transactional
        public EmployeeTaskResponseDto updateTaskStatus(UUID employeeId, UUID taskId, UpdateTaskStatusDto dto) {
                Booking booking = bookingRepository.findByIdAndEmployeeId(taskId, employeeId)
                                .orElseThrow(() -> new RuntimeException("Task not found"));

                booking.setStatus(BookingStatus.valueOf(dto.getStatus()));

                if (dto.getStartTime() != null)
                        booking.setActualStartTime(LocalDateTime.parse(dto.getStartTime()));

                if (dto.getEndTime() != null)
                        booking.setActualEndTime(LocalDateTime.parse(dto.getEndTime()));

                Booking updated = bookingRepository.save(booking);
                createStatusChangeNotification(employeeId, updated);

                return convertToTaskDto(updated);
        }

        // ---------------- NOTIFICATIONS ----------------

        @Transactional(readOnly = true)
        public List<EmployeeNotificationResponseDto> getNotifications(UUID employeeId) {
                return notificationRepository.findByEmployeeId(employeeId).stream()
                                .map(this::convertToNotificationDto)
                                .collect(Collectors.toList());
        }

        // ---------------- HELPERS ----------------

        private EmployeeResponseDto toResponseDto(Employee emp) {
                return EmployeeResponseDto.builder()
                                .id(emp.getId())
                                .name(emp.getName())
                                .email(emp.getEmail())
                                .phone(emp.getPhone())
                                .address(emp.getAddress())
                                .active(emp.isActive())
                                .build();
        }

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

        private void createStatusChangeNotification(UUID employeeId, Booking booking) {
                Employee employee = employeeRepository.findById(employeeId)
                                .orElseThrow(() -> new RuntimeException("Employee not found"));

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