package com.shawilTech.netproxi.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.shawilTech.netproxi.dto.BookingResponseDto;
import com.shawilTech.netproxi.service.BookingService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/employee/bookings")
@RequiredArgsConstructor
public class EmployeeBookingController {

    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<List<BookingResponseDto>> getAssignedBookings() {
        return ResponseEntity.ok(bookingService.getAssignedBookings());
    }

    @GetMapping("/today")
    public ResponseEntity<List<BookingResponseDto>> getTodayBookings() {
        return ResponseEntity.ok(bookingService.getTodayAssignedBookings());
    }

    @PatchMapping("/{bookingId}/start")
    public ResponseEntity<BookingResponseDto> startBooking(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.startAssignedBooking(bookingId));
    }

    @PatchMapping("/{bookingId}/complete")
    public ResponseEntity<BookingResponseDto> completeBooking(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(bookingService.completeAssignedBooking(bookingId));
    }
}
