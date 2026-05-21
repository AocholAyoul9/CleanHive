package com.shawilTech.netproxi.service;


import com.shawilTech.netproxi.dto.*;
import com.shawilTech.netproxi.entity.*;
import com.shawilTech.netproxi.repository.*;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ClientRepository clientRepository;
    private final ServiceRepository serviceRepository;
    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;

 @Transactional
public BookingResponseDto createBooking(BookingRequestDto request) {

    // ---------------------------
    // Validate client
    // ---------------------------
    /*Client client = clientRepository.findById(request.getClientId())
            .orElseThrow(() -> new RuntimeException("Client not found"));*/

    // ---------------------------
    // Validate service
    // ---------------------------
    ServiceEntity service = serviceRepository.findById(request.getServiceId())
            .orElseThrow(() -> new RuntimeException("Service not found"));

    // ---------------------------
    // Validate company
    // ---------------------------
    Company company = companyRepository.findById(request.getCompanyId())
            .orElseThrow(() -> new RuntimeException("Company not found"));

    // Service must belong to company
    if (!service.getCompany().getId().equals(company.getId())) {
        throw new RuntimeException("Service does not belong to this company");
    }

  

    // ---------------------------
    // Validate timestamps
    // ---------------------------
    LocalDateTime start = request.getStartTime();
    LocalDateTime end = start.plusMinutes(service.getDurationInMinutes());

    /*if (start.isBefore(LocalDateTime.now())) {
        throw new RuntimeException("Cannot book a time in the past");
    }

    // ---------------------------
    // Conflict check: client
    // ---------------------------
    /*boolean clientConflict =
            bookingRepository.existsByClientIdAndStartTimeLessThanAndEndTimeGreaterThan(
                    request.getClientId(), end, start);

    if (clientConflict) {
        throw new RuntimeException("You already have another booking at this time");
    }

   
    // ---------------------------
    // Service & company active check
    // ---------------------------
   /*  if (!service.isActive()) {
        throw new RuntimeException("Service is inactive");
    }

    if (!company.isActive()) {
        throw new RuntimeException("Company is inactive");
    }*/

    // ---------------------------
    // Create booking
    // ---------------------------
    Booking booking = new Booking();
    //booking.setClient(client);
    booking.setService(service);
    booking.setCompany(company);
    booking.setStartTime(start);
    booking.setEndTime(end);
    booking.setAddress(request.getAddress());
    booking.setPrice(BigDecimal.valueOf(service.getBasePrice()));
    booking.setStatus(BookingStatus.PENDING);

    Booking savedBooking = bookingRepository.save(booking);

    return mapToBookingResponseDto(savedBooking);
}






  @Transactional
public BookingResponseDto assignBookingToEmployee(
        UUID companyId,
        UUID bookingId,
        UUID employeeId) {

    Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

    if (!booking.getCompany().getId().equals(companyId)) {
        throw new RuntimeException("Booking does not belong to this company");
    }

    if (booking.getStatus() == BookingStatus.CANCELLED ||
        booking.getStatus() == BookingStatus.COMPLETED) {
        throw new RuntimeException("Cannot assign employee to this booking");
    }

    Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found"));

    if (!employee.getCompany().getId().equals(companyId)) {
        throw new RuntimeException("Employee does not belong to this company");
    }

    boolean conflict =
        bookingRepository.existsByEmployeeIdAndStartTimeLessThanAndEndTimeGreaterThan(
            employeeId,
            booking.getEndTime(),
            booking.getStartTime()
        );

    if (conflict) {
        throw new RuntimeException("Employee is already booked at this time");
    }

    booking.setEmployee(employee);
    booking.setStatus(BookingStatus.CONFIRMED);

    return mapToBookingResponseDto(bookingRepository.save(booking));
}


    /**
     * Get all bookings for a client
     */
    public List<BookingResponseDto> getClientBookings(UUID clientId) {
        if (!clientRepository.existsById(clientId)) {
            throw new RuntimeException("Client not found with ID: " + clientId);
        }

        return bookingRepository.findByClientId(clientId)
                .stream()
                .map(this::mapToBookingResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Get all bookings for a company
     */
    public List<BookingResponseDto> getCompanyBookings(UUID companyId) {
        if (!companyRepository.existsById(companyId)) {
            throw new RuntimeException("Company not found with ID: " + companyId);
        }

        return bookingRepository.findByCompanyId(companyId)
                .stream()
                .map(this::mapToBookingResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Get client's bookings for a specific company
     */
    public List<BookingResponseDto> getClientBookingsForCompany(UUID clientId, UUID companyId) {
        if (!clientRepository.existsById(clientId)) {
            throw new RuntimeException("Client not found with ID: " + clientId);
        }
        if (!companyRepository.existsById(companyId)) {
            throw new RuntimeException("Company not found with ID: " + companyId);
        }

        return bookingRepository.findByClientIdAndCompanyId(clientId, companyId)
                .stream()
                .map(this::mapToBookingResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Get booking by ID
     */
    public BookingResponseDto getBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

        return mapToBookingResponseDto(booking);
    }

    /**
     * Update booking status
     */
    @Transactional
    public BookingResponseDto updateBookingStatus(UUID bookingId, BookingStatus status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

        booking.setStatus(status);
        Booking updatedBooking = bookingRepository.save(booking);

        return mapToBookingResponseDto(updatedBooking);
    }

    /**
     * Cancel a booking
     */
    @Transactional
    public BookingResponseDto cancelBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

        // Check if booking can be cancelled (only pending or confirmed bookings can be
        // cancelled)
        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed booking");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking cancelledBooking = bookingRepository.save(booking);

        return mapToBookingResponseDto(cancelledBooking);
    }

    /**
     * 
     * @param bookingId
     * @param dto
     */
    @Transactional
    public void addReviewToBooking(UUID bookingId, ReviewRequestDto dto) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException("You can only review completed bookings");
        }

        booking.setRating(dto.getRating());
        booking.setReview(dto.getReview());

        bookingRepository.save(booking);
    }

    /**
     * Map Booking entity to BookingResponseDto
     */
    private BookingResponseDto mapToBookingResponseDto(Booking booking) {
        BookingResponseDto.BookingResponseDtoBuilder builder = BookingResponseDto.builder()
                .id(booking.getId())
                .clientId(booking.getClient().getId())
                .clientName(booking.getClient().getName())
                .serviceId(booking.getService().getId())
                .serviceName(booking.getService().getName())
                .companyId(booking.getCompany().getId())
                .companyName(booking.getCompany().getName())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .address(booking.getAddress())
                .price(booking.getPrice())
                .status(booking.getStatus().name());


        return builder.build();
    }
}
