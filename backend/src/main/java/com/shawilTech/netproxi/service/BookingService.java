package com.shawilTech.netproxi.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shawilTech.netproxi.dto.BookingRequestDto;
import com.shawilTech.netproxi.dto.BookingResponseDto;
import com.shawilTech.netproxi.dto.ReviewRequestDto;
import com.shawilTech.netproxi.entity.Booking;
import com.shawilTech.netproxi.entity.BookingStatus;
import com.shawilTech.netproxi.entity.Client;
import com.shawilTech.netproxi.entity.Company;
import com.shawilTech.netproxi.entity.Employee;
import com.shawilTech.netproxi.entity.ServiceEntity;
import com.shawilTech.netproxi.entity.User;
import com.shawilTech.netproxi.exception.InvalidBookingStateException;
import com.shawilTech.netproxi.exception.ResourceNotFoundException;
import com.shawilTech.netproxi.exception.UnauthorizedActionException;
import com.shawilTech.netproxi.repository.BookingRepository;
import com.shawilTech.netproxi.repository.ClientRepository;
import com.shawilTech.netproxi.repository.CompanyRepository;
import com.shawilTech.netproxi.repository.EmployeeRepository;
import com.shawilTech.netproxi.repository.ServiceRepository;
import com.shawilTech.netproxi.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ClientRepository clientRepository;
    private final ServiceRepository serviceRepository;
    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final BookingValidationService bookingValidationService;
    private final BookingAssignmentService bookingAssignmentService;

    @Transactional
    public BookingResponseDto createBooking(BookingRequestDto request) {
        Client client = getCurrentClient();

        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        ServiceEntity service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service not found"));

        LocalDateTime startTime = request.getStartTime();
        LocalDateTime endTime = request.getEndTime() != null ? request.getEndTime()
                : startTime.plusMinutes(service.getDurationInMinutes());

        bookingValidationService.validateCreateBooking(client, company, service, startTime, endTime);

        Booking booking = new Booking();
        booking.setClient(client);
        booking.setCompany(company);
        booking.setService(service);
        booking.setStatus(BookingStatus.PENDING);
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setAddress(request.getAddress());
        booking.setPrice(request.getPrice() != null ? request.getPrice() : BigDecimal.valueOf(service.getBasePrice()));

        return mapToBookingResponseDto(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDto> getClientBookings() {
        UUID clientId = getCurrentClient().getId();
        return bookingRepository.findByClientId(clientId).stream().map(this::mapToBookingResponseDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDto> getClientUpcomingBookings() {
        UUID clientId = getCurrentClient().getId();
        return bookingRepository.findByClientIdAndStartTimeAfterOrderByStartTimeAsc(clientId, LocalDateTime.now())
                .stream()
                .filter(booking -> booking.getStatus() != BookingStatus.CANCELLED && booking.getStatus() != BookingStatus.COMPLETED)
                .map(this::mapToBookingResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDto> getClientBookingHistory() {
        UUID clientId = getCurrentClient().getId();
        return bookingRepository.findByClientIdAndStatusInHistory(clientId)
                .stream()
                .map(this::mapToBookingResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getClientDashboardSummary() {
        UUID clientId = getCurrentClient().getId();
        return Map.of(
                "total", (long) bookingRepository.findByClientId(clientId).size(),
                "pending", bookingRepository.countByClientIdAndStatus(clientId, BookingStatus.PENDING),
                "confirmed", bookingRepository.countByClientIdAndStatus(clientId, BookingStatus.CONFIRMED),
                "inProgress", bookingRepository.countByClientIdAndStatus(clientId, BookingStatus.IN_PROGRESS),
                "completed", bookingRepository.countByClientIdAndStatus(clientId, BookingStatus.COMPLETED),
                "cancelled", bookingRepository.countByClientIdAndStatus(clientId, BookingStatus.CANCELLED));
    }

    @Transactional
    public BookingResponseDto cancelClientBooking(UUID bookingId) {
        Client client = getCurrentClient();
        Booking booking = getBookingEntity(bookingId);
        bookingValidationService.validateClientCanCancel(booking, client.getId());
        booking.setStatus(BookingStatus.CANCELLED);
        return mapToBookingResponseDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponseDto addClientReview(UUID bookingId, ReviewRequestDto dto) {
        Client client = getCurrentClient();
        Booking booking = getBookingEntity(bookingId);
        bookingValidationService.validateClientCanReview(booking, client.getId());
        booking.setRating(dto.getRating());
        booking.setReview(dto.getReview());
        return mapToBookingResponseDto(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDto> getCompanyBookings() {
        UUID companyId = getCurrentCompanyAdmin().getId();
        return bookingRepository.findByCompanyId(companyId).stream().map(this::mapToBookingResponseDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDto> getCompanyPendingBookings() {
        UUID companyId = getCurrentCompanyAdmin().getId();
        return bookingRepository.findByCompanyIdAndStatus(companyId, BookingStatus.PENDING)
                .stream()
                .map(this::mapToBookingResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponseDto assignBookingToEmployee(UUID bookingId, UUID employeeId) {
        Company company = getCurrentCompanyAdmin();
        return mapToBookingResponseDto(bookingAssignmentService.assignEmployee(company, bookingId, employeeId));
    }

    @Transactional
    public BookingResponseDto reassignBookingToEmployee(UUID bookingId, UUID employeeId) {
        return assignBookingToEmployee(bookingId, employeeId);
    }

    @Transactional
    public BookingResponseDto markBookingConfirmed(UUID bookingId) {
        Company company = getCurrentCompanyAdmin();
        return mapToBookingResponseDto(bookingAssignmentService.markConfirmed(company, bookingId));
    }

    @Transactional
    public BookingResponseDto markBookingCancelled(UUID bookingId) {
        Company company = getCurrentCompanyAdmin();
        return mapToBookingResponseDto(bookingAssignmentService.markCancelled(company, bookingId));
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDto> getAssignedBookings() {
        Employee employee = getCurrentEmployee();
        return bookingRepository.findByEmployeeId(employee.getId()).stream().map(this::mapToBookingResponseDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDto> getTodayAssignedBookings() {
        Employee employee = getCurrentEmployee();
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        return bookingRepository.findByEmployeeIdAndStartTimeBetweenOrderByStartTimeAsc(employee.getId(), start, end)
                .stream()
                .map(this::mapToBookingResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponseDto startAssignedBooking(UUID bookingId) {
        Employee employee = getCurrentEmployee();
        Booking booking = getBookingEntity(bookingId);
        bookingValidationService.validateEmployeeCanStart(booking, employee.getId());
        booking.setStatus(BookingStatus.IN_PROGRESS);
        booking.setActualStartTime(LocalDateTime.now());
        return mapToBookingResponseDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponseDto completeAssignedBooking(UUID bookingId) {
        Employee employee = getCurrentEmployee();
        Booking booking = getBookingEntity(bookingId);
        bookingValidationService.validateEmployeeCanComplete(booking, employee.getId());
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setActualEndTime(LocalDateTime.now());
        return mapToBookingResponseDto(bookingRepository.save(booking));
    }

    // Compatibility methods for existing controllers
    @Transactional
    public BookingResponseDto assignBookingToEmployee(UUID companyId, UUID bookingId, UUID employeeId) {
        Company company = getCurrentCompanyAdmin();
        if (!company.getId().equals(companyId)) {
            throw new UnauthorizedActionException("Cannot manage bookings for another company");
        }
        return mapToBookingResponseDto(bookingAssignmentService.assignEmployee(company, bookingId, employeeId));
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDto> getClientBookings(UUID clientId) {
        return bookingRepository.findByClientId(clientId).stream().map(this::mapToBookingResponseDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDto> getCompanyBookings(UUID companyId) {
        return bookingRepository.findByCompanyId(companyId).stream().map(this::mapToBookingResponseDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDto> getClientBookingsForCompany(UUID clientId, UUID companyId) {
        return bookingRepository.findByClientIdAndCompanyId(clientId, companyId).stream().map(this::mapToBookingResponseDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookingResponseDto getBooking(UUID bookingId) {
        return mapToBookingResponseDto(getBookingEntity(bookingId));
    }

    @Transactional
    public BookingResponseDto updateBookingStatus(UUID bookingId, BookingStatus status) {
        Booking booking = getBookingEntity(bookingId);
        booking.setStatus(status);
        return mapToBookingResponseDto(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponseDto cancelBooking(UUID bookingId) {
        Booking booking = getBookingEntity(bookingId);
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new InvalidBookingStateException("Booking cannot be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        return mapToBookingResponseDto(bookingRepository.save(booking));
    }

    @Transactional
    public void addReviewToBooking(UUID bookingId, ReviewRequestDto dto) {
        Booking booking = getBookingEntity(bookingId);
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new InvalidBookingStateException("You can only review completed bookings");
        }
        booking.setRating(dto.getRating());
        booking.setReview(dto.getReview());
        bookingRepository.save(booking);
    }

    private Booking getBookingEntity(UUID bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    }

    private String getCurrentPrincipal() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            throw new UnauthorizedActionException("Authentication required");
        }
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private User getCurrentUser() {
        String principal = getCurrentPrincipal();
        return userRepository.findByUsername(principal)
                .or(() -> userRepository.findByEmail(principal))
                .orElseThrow(() -> new UnauthorizedActionException("Authenticated user not found"));
    }

    private Client getCurrentClient() {
        String principal = getCurrentPrincipal();
        User user = getCurrentUser();
        return clientRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new UnauthorizedActionException("Client profile not found for authenticated user. Please complete client registration."));
    }

    private Company getCurrentCompanyAdmin() {
        User user = getCurrentUser();
        if (user.getCompany() == null) {
            throw new UnauthorizedActionException("Authenticated user is not a company admin");
        }
        return user.getCompany();
    }

    private Employee getCurrentEmployee() {
        String principal = getCurrentPrincipal();
        User user = userRepository.findByUsername(principal).orElse(null);
        String email = user != null ? user.getEmail() : principal;
        return employeeRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedActionException("Authenticated user is not an employee"));
    }

    private BookingResponseDto mapToBookingResponseDto(Booking booking) {
        String employeeName = booking.getEmployee() != null ? booking.getEmployee().getName() : null;
        UUID employeeId = booking.getEmployee() != null ? booking.getEmployee().getId() : null;

        return BookingResponseDto.builder()
                .id(booking.getId())
                .clientId(booking.getClient() != null ? booking.getClient().getId() : null)
                .clientName(booking.getClient() != null ? booking.getClient().getName() : null)
                .serviceId(booking.getService() != null ? booking.getService().getId() : null)
                .serviceName(booking.getService() != null ? booking.getService().getName() : null)
                .companyId(booking.getCompany() != null ? booking.getCompany().getId() : null)
                .companyName(booking.getCompany() != null ? booking.getCompany().getName() : null)
                .employeeId(employeeId)
                .employeeName(employeeName)
                .assignedEmployeeId(employeeId)
                .assignedEmployeeName(employeeName)
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .address(booking.getAddress())
                .price(booking.getPrice())
                .status(booking.getStatus() != null ? booking.getStatus().name() : null)
                .rating(booking.getRating())
                .review(booking.getReview())
                .build();
    }
}
