package com.shawilTech.netproxi.controller;

import com.shawilTech.netproxi.dto.*;
import com.shawilTech.netproxi.entity.*;
import com.shawilTech.netproxi.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/companies/{companyId}/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings", description = "APIs for managing company bookings")
public class BookingController {

    private final BookingService bookingService;

    // ------------------- CREATE -------------------
    @Operation(summary = "Create a new booking for a company")
    @PostMapping
    public ResponseEntity<BookingResponseDto> createBooking(
            @PathVariable UUID companyId,
            @RequestBody BookingRequestDto request) {

        request.setCompanyId(companyId); // enforce companyId from URL
        BookingResponseDto response = bookingService.createBooking(request);
        return ResponseEntity.ok(response);
    }

    // ------------------- GET BOOKINGS -------------------
    @Operation(summary = "Get all bookings for a company")
    @GetMapping
    public ResponseEntity<List<BookingResponseDto>> getCompanyBookings(@PathVariable UUID companyId) {
        List<BookingResponseDto> bookings = bookingService.getCompanyBookings();
        return ResponseEntity.ok(bookings);
    }

    // ------------------- CANCEL BOOKING -------------------
    @Operation(summary = "Cancel a booking")
    @PatchMapping("/{bookingId}/cancel")
    public ResponseEntity<BookingResponseDto> cancelBooking(
            @PathVariable UUID companyId,
            @PathVariable UUID bookingId) {

        BookingResponseDto cancelledBooking = bookingService.markBookingCancelled(bookingId);
        return ResponseEntity.ok(cancelledBooking);
    }

    // ------------------- UPDATE BOOKING STATUS -------------------
    @Operation(summary = "Update booking status")
    @PatchMapping("/{bookingId}/status")
    public ResponseEntity<BookingResponseDto> updateBookingStatus(
            @PathVariable UUID companyId,
            @PathVariable UUID bookingId,
            @RequestParam BookingStatus status) {
        if (status == BookingStatus.CONFIRMED) {
            return ResponseEntity.ok(bookingService.markBookingConfirmed(bookingId));
        }
        if (status == BookingStatus.CANCELLED) {
            return ResponseEntity.ok(bookingService.markBookingCancelled(bookingId));
        }
        BookingResponseDto updatedBooking = bookingService.updateBookingStatus(bookingId, status);
        return ResponseEntity.ok(updatedBooking);
    }

    // ------------------- ASSIGN EMPLOYEE -------------------
    @PatchMapping("/{bookingId}/assign")
    public ResponseEntity<BookingResponseDto> assignBooking(
            @PathVariable UUID companyId,
            @PathVariable UUID bookingId,
            @RequestParam UUID employeeId) {

        return ResponseEntity.ok(
                bookingService.assignBookingToEmployee(bookingId, employeeId));
    }

    // ------------------- GET BOOKING BY ID -------------------
    @Operation(summary = "Get a booking by ID")
    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponseDto> getBooking(
            @PathVariable UUID companyId,
            @PathVariable UUID bookingId) {

        BookingResponseDto booking = bookingService.getBooking(bookingId);
        return ResponseEntity.ok(booking);
    }
}
