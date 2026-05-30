package com.shawilTech.netproxi.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.shawilTech.netproxi.entity.Booking;
import com.shawilTech.netproxi.entity.BookingStatus;
import com.shawilTech.netproxi.entity.Client;
import com.shawilTech.netproxi.entity.Company;
import com.shawilTech.netproxi.entity.ServiceEntity;
import com.shawilTech.netproxi.exception.BookingConflictException;
import com.shawilTech.netproxi.exception.InvalidBookingStateException;
import com.shawilTech.netproxi.exception.UnauthorizedActionException;
import com.shawilTech.netproxi.repository.BookingRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingValidationService {

    private final BookingRepository bookingRepository;

    public void validateCreateBooking(Client client, Company company, ServiceEntity service, LocalDateTime startTime,
            LocalDateTime endTime) {
        if (client == null) {
            throw new UnauthorizedActionException("Authenticated client is required");
        }
        if (company == null) {
            throw new InvalidBookingStateException("Company is required");
        }
        if (service == null) {
            throw new InvalidBookingStateException("Service is required");
        }
        if (startTime == null || endTime == null) {
            throw new InvalidBookingStateException("Booking start and end time are required");
        }
        if (startTime.isBefore(LocalDateTime.now())) {
            throw new InvalidBookingStateException("Cannot book a time in the past");
        }
        if (!service.getCompany().getId().equals(company.getId())) {
            throw new InvalidBookingStateException("Service does not belong to the selected company");
        }
        if (!company.isActive()) {
            throw new InvalidBookingStateException("Company is inactive");
        }
        if (!service.isActive()) {
            throw new InvalidBookingStateException("Service is inactive");
        }

        if (bookingRepository.hasClientActiveConflict(client.getId(), endTime, startTime)) {
            throw new BookingConflictException("Client already has an overlapping booking");
        }
    }

    public void validateEmployeeAvailability(UUID employeeId, LocalDateTime startTime, LocalDateTime endTime) {
        if (bookingRepository.hasEmployeeActiveConflict(employeeId, endTime, startTime)) {
            throw new BookingConflictException("Employee already has an overlapping booking");
        }
    }

    public void validateClientCanCancel(Booking booking, UUID clientId) {
        if (!booking.getClient().getId().equals(clientId)) {
            throw new UnauthorizedActionException("Booking does not belong to authenticated client");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new InvalidBookingStateException("Booking cannot be cancelled");
        }
    }

    public void validateClientCanReview(Booking booking, UUID clientId) {
        if (!booking.getClient().getId().equals(clientId)) {
            throw new UnauthorizedActionException("Booking does not belong to authenticated client");
        }
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new InvalidBookingStateException("You can only review completed bookings");
        }
    }

    public void validateEmployeeCanStart(Booking booking, UUID employeeId) {
        if (booking.getEmployee() == null || !booking.getEmployee().getId().equals(employeeId)) {
            throw new UnauthorizedActionException("Booking is not assigned to authenticated employee");
        }
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new InvalidBookingStateException("Only confirmed bookings can be started");
        }
    }

    public void validateEmployeeCanComplete(Booking booking, UUID employeeId) {
        if (booking.getEmployee() == null || !booking.getEmployee().getId().equals(employeeId)) {
            throw new UnauthorizedActionException("Booking is not assigned to authenticated employee");
        }
        if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
            throw new InvalidBookingStateException("Only in-progress bookings can be completed");
        }
    }
}
