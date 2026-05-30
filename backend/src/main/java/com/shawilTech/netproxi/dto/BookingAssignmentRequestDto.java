package com.shawilTech.netproxi.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingAssignmentRequestDto {
    @NotNull
    private UUID employeeId;
}
