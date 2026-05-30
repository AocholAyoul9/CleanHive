package com.shawilTech.netproxi.dto;

import com.shawilTech.netproxi.entity.BookingStatus;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;
import java.time.*;
import java.math.BigDecimal;

@Data
public class BookingRequestDto {
    private UUID companyId;
    @NotNull
    private UUID serviceId;
    private UUID employeeId;
    @NotNull
    @Future
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    @NotBlank
    private String address;
    private BigDecimal price;
    private BookingStatus status;
}