package com.shawilTech.netproxi.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.shawilTech.netproxi.dto.BookingRequestDto;
import com.shawilTech.netproxi.dto.BookingResponseDto;
import com.shawilTech.netproxi.dto.ReviewRequestDto;
import com.shawilTech.netproxi.service.BookingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/client/bookings")
@RequiredArgsConstructor
public class ClientBookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponseDto> createBooking(@Valid @RequestBody BookingRequestDto request) {
        return ResponseEntity.ok(bookingService.createBooking(request));
    }

    @GetMapping
    public ResponseEntity<List<BookingResponseDto>> getAllClientBookings() {
        return ResponseEntity.ok(bookingService.getClientBookings());
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<BookingResponseDto>> getUpcomingBookings() {
        return ResponseEntity.ok(bookingService.getClientUpcomingBookings());
    }

    @GetMapping("/history")
    public ResponseEntity<List<BookingResponseDto>> getBookingHistory() {
        return ResponseEntity.ok(bookingService.getClientBookingHistory());
    }

    @GetMapping("/dashboard-summary")
    public ResponseEntity<Map<String, Long>> getBookingSummary() {
        return ResponseEntity.ok(bookingService.getClientDashboardSummary());
    }

    @PatchMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingResponseDto> cancelBooking(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.cancelClientBooking(bookingId));
    }

    @PostMapping("/{bookingId}/review")
    public ResponseEntity<BookingResponseDto> addReview(@PathVariable UUID bookingId, @Valid @RequestBody ReviewRequestDto dto) {
        return ResponseEntity.ok(bookingService.addClientReview(bookingId, dto));
    }
}
