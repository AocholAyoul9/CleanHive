package com.shawilTech.netproxi.dto;

import lombok.Data;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@Data
public class ReviewRequestDto {
    @Min(1)
    @Max(5)
    private int rating;
    @NotBlank
    private String review;
}
