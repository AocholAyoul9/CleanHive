package com.shawilTech.netproxi.repository;
import com.shawilTech.netproxi.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> findByClientId(UUID clientId);

    List<Booking> findByCompanyId(UUID companyId);

    List<Booking> findByServiceId(UUID serviceId);

    boolean existsByClientIdAndStartTimeLessThanAndEndTimeGreaterThan(
            UUID clientId,
            LocalDateTime endTime,
            LocalDateTime startTime
    );

    @Query("SELECT (COUNT(b) > 0) FROM Booking b WHERE b.client.id = :clientId " +
            "AND b.status NOT IN ('CANCELLED', 'COMPLETED') " +
            "AND b.startTime < :endTime AND b.endTime > :startTime")
    boolean hasClientActiveConflict(@Param("clientId") UUID clientId,
            @Param("endTime") LocalDateTime endTime,
            @Param("startTime") LocalDateTime startTime);

    boolean existsByEmployeeIdAndStartTimeLessThanAndEndTimeGreaterThan(
        UUID employeeId,
        LocalDateTime endTime,
        LocalDateTime startTime
    );

    @Query("SELECT (COUNT(b) > 0) FROM Booking b WHERE b.employee.id = :employeeId " +
            "AND b.status NOT IN ('CANCELLED', 'COMPLETED') " +
            "AND b.startTime < :endTime AND b.endTime > :startTime")
    boolean hasEmployeeActiveConflict(@Param("employeeId") UUID employeeId,
            @Param("endTime") LocalDateTime endTime,
            @Param("startTime") LocalDateTime startTime);


    List<Booking> findByClientIdAndCompanyId(UUID clientId, UUID companyId);
    List<Booking> findByClientIdAndStatus(UUID clientId, BookingStatus status);
    List<Booking> findByEmployeeIdAndStatus(UUID employeeId, BookingStatus status);
    List<Booking> findByCompanyIdAndStatus(UUID companyId, BookingStatus status);
    List<Booking> findByClientIdAndStartTimeAfterOrderByStartTimeAsc(UUID clientId, LocalDateTime startTime);
    List<Booking> findByEmployeeIdAndStartTimeBetweenOrderByStartTimeAsc(UUID employeeId, LocalDateTime start, LocalDateTime end);
    long countByClientIdAndStatus(UUID clientId, BookingStatus status);

    // History includes both COMPLETED and CANCELLED
    @Query("SELECT b FROM Booking b WHERE b.client.id = :clientId AND b.status IN ('COMPLETED', 'CANCELLED')")
    List<Booking> findByClientIdAndStatusInHistory(@Param("clientId") UUID clientId);


    // New methods for employee dashboard
    List<Booking> findByEmployeeId(UUID employeeId);
    
    @Query("SELECT b FROM Booking b WHERE b.employee.id = :employeeId " +
           "AND DATE(b.startTime) = :date")
    List<Booking> findByEmployeeIdAndDate(@Param("employeeId") UUID employeeId, 
                                         @Param("date") LocalDate date);
    
    @Query("SELECT b FROM Booking b WHERE b.employee.id = :employeeId " +
           "AND b.startTime >= :startDate AND b.startTime <= :endDate")
    List<Booking> findByEmployeeIdAndDateRange(@Param("employeeId") UUID employeeId,
                                              @Param("startDate") LocalDate startDate,
                                              @Param("endDate") LocalDate endDate);
    
    @Query("SELECT b FROM Booking b WHERE b.employee.id = :employeeId " +
           "AND b.status = 'COMPLETED' AND b.actualEndTime >= :sinceDate")
    List<Booking> findCompletedTasksByEmployeeSince(@Param("employeeId") UUID employeeId,
                                                   @Param("sinceDate") LocalDate sinceDate);
    
    @Query("SELECT b FROM Booking b WHERE b.employee.id = :employeeId " +
           "AND b.startTime >= :startDate")
    List<Booking> findByEmployeeIdAndDateAfter(@Param("employeeId") UUID employeeId,
                                              @Param("startDate") LocalDate startDate);
    
    Optional<Booking> findByIdAndEmployeeId(UUID id, UUID employeeId);
}

