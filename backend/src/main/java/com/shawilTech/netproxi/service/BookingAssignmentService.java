package com.shawilTech.netproxi.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.shawilTech.netproxi.entity.Booking;
import com.shawilTech.netproxi.entity.BookingStatus;
import com.shawilTech.netproxi.entity.Company;
import com.shawilTech.netproxi.entity.Employee;
import com.shawilTech.netproxi.exception.InvalidBookingStateException;
import com.shawilTech.netproxi.exception.ResourceNotFoundException;
import com.shawilTech.netproxi.exception.UnauthorizedActionException;
import com.shawilTech.netproxi.repository.BookingRepository;
import com.shawilTech.netproxi.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingAssignmentService {

    private final BookingRepository bookingRepository;
    private final EmployeeRepository employeeRepository;
    private final BookingValidationService bookingValidationService;

    @Transactional
    public Booking assignEmployee(Company company, UUID bookingId, UUID employeeId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getCompany().getId().equals(company.getId())) {
            throw new UnauthorizedActionException("Booking does not belong to your company");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new InvalidBookingStateException("Cannot assign employee to a finished/cancelled booking");
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

        if (!employee.getCompany().getId().equals(company.getId())) {
            throw new UnauthorizedActionException("Employee does not belong to your company");
        }
        if (!employee.isAvailable()) {
            throw new InvalidBookingStateException("Employee is currently unavailable");
        }

        if (booking.getEmployee() == null || !booking.getEmployee().getId().equals(employeeId)) {
            bookingValidationService.validateEmployeeAvailability(employeeId, booking.getStartTime(), booking.getEndTime());
        }
        booking.setEmployee(employee);
        booking.setStatus(BookingStatus.CONFIRMED);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking markConfirmed(Company company, UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (!booking.getCompany().getId().equals(company.getId())) {
            throw new UnauthorizedActionException("Booking does not belong to your company");
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new InvalidBookingStateException("Only pending bookings can be confirmed");
        }
        booking.setStatus(BookingStatus.CONFIRMED);
        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking markCancelled(Company company, UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        if (!booking.getCompany().getId().equals(company.getId())) {
            throw new UnauthorizedActionException("Booking does not belong to your company");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new InvalidBookingStateException("Booking cannot be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        return bookingRepository.save(booking);
    }
}
