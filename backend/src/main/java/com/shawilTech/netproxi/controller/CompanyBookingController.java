package com.shawilTech.netproxi.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.shawilTech.netproxi.dto.BookingAssignmentRequestDto;
import com.shawilTech.netproxi.dto.BookingResponseDto;
import com.shawilTech.netproxi.service.BookingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/company/bookings")
@RequiredArgsConstructor
public class CompanyBookingController {

    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<List<BookingResponseDto>> getCompanyBookings() {
        return ResponseEntity.ok(bookingService.getCompanyBookings());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<BookingResponseDto>> getPendingBookings() {
        return ResponseEntity.ok(bookingService.getCompanyPendingBookings());
    }

    @PatchMapping("/{bookingId}/assign")
    public ResponseEntity<BookingResponseDto> assignEmployee(@PathVariable UUID bookingId,
            @Valid @RequestBody BookingAssignmentRequestDto request) {
        return ResponseEntity.ok(bookingService.assignBookingToEmployee(bookingId, request.getEmployeeId()));
    }

    @PatchMapping("/{bookingId}/reassign")
    public ResponseEntity<BookingResponseDto> reassignEmployee(@PathVariable UUID bookingId,
            @Valid @RequestBody BookingAssignmentRequestDto request) {
        return ResponseEntity.ok(bookingService.reassignBookingToEmployee(bookingId, request.getEmployeeId()));
    }

    @PatchMapping("/{bookingId}/confirm")
    public ResponseEntity<BookingResponseDto> markConfirmed(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.markBookingConfirmed(bookingId));
    }

    @PatchMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingResponseDto> markCancelled(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.markBookingCancelled(bookingId));
    }
}
