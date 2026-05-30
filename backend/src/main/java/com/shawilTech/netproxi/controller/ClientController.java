package com.shawilTech.netproxi.controller;


import com.shawilTech.netproxi.entity.BookingStatus;
import com.shawilTech.netproxi.dto.*;
import com.shawilTech.netproxi.service.*;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;
    private final BookingService bookingService;

    @PostMapping("/register")
    public ResponseEntity<ClientResponseDto> registerClient(@RequestBody ClientRequestDto clientRequest) {
        ClientResponseDto response = clientService.registerClient(clientRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<ClientResponseDto> loginClient(@RequestBody ClientLoginRequestDto clientRequest) {
        ClientResponseDto response = clientService.loginClient(clientRequest);
        return ResponseEntity.ok(response);
    }


     // ------------------------------------------------------------------------
    // Load client reservations - uses JWT authentication for proper client lookup
    // ------------------------------------------------------------------------
    @GetMapping("/reservations")
    public ResponseEntity<List<BookingResponseDto>> getClientReservations() {
        return ResponseEntity.ok(bookingService.getClientBookings());
    }

    @GetMapping("/reservations/upcoming")
    public ResponseEntity<List<BookingResponseDto>> getUpcomingReservations() {
        return ResponseEntity.ok(bookingService.getClientUpcomingBookings());
    }

    @GetMapping("/reservations/history")
    public ResponseEntity<List<BookingResponseDto>> getBookingHistory() {
        return ResponseEntity.ok(bookingService.getClientBookingHistory());
    }

    @GetMapping("/reservations/dashboard-summary")
    public ResponseEntity<java.util.Map<String, Long>> getBookingSummary() {
        return ResponseEntity.ok(bookingService.getClientDashboardSummary());
    }

    // ------------------------------------------------------------------------
    // Update reservation status
    // ------------------------------------------------------------------------
    @PutMapping("/reservations/{reservationId}/status")
    public ResponseEntity<BookingResponseDto> updateStatus(
            @PathVariable UUID reservationId,
            @RequestBody UpdateStatusDto dto
    ) {
        BookingStatus status = BookingStatus.valueOf(dto.getStatus().toUpperCase());
        if (status == BookingStatus.CANCELLED) {
            return ResponseEntity.ok(bookingService.cancelClientBooking(reservationId));
        }
        return ResponseEntity.ok(bookingService.updateBookingStatus(reservationId, status));
    }

    // ------------------------------------------------------------------------
    // Add reservation review
    // ------------------------------------------------------------------------
    @PostMapping("/reservations/{reservationId}/review")
    public ResponseEntity<String> addReview(
            @PathVariable UUID reservationId,
            @RequestBody ReviewRequestDto reviewDto
    ) {
        bookingService.addClientReview(reservationId, reviewDto);
        return ResponseEntity.ok("Review added successfully");
    }

    // ------------------------------------------------------------------------
    // Get client profile (JWT authenticated)
    // ------------------------------------------------------------------------
    @GetMapping("/profile")
    public ResponseEntity<ClientResponseDto> getClientProfile() {
        return ResponseEntity.ok(clientService.getClientProfile());
    }

}