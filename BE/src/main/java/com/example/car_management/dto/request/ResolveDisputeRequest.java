package com.example.car_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResolveDisputeRequest {

    @NotNull(message = "Final amount is required")
    private BigDecimal finalAmount;

    @NotBlank(message = "Resolution notes are required")
    private String resolutionNotes;
}
