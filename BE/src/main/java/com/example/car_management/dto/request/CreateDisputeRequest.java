package com.example.car_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateDisputeRequest {

    @NotNull(message = "Booking ID is required")
    private Integer bookingId;

    @NotBlank(message = "Reason is required")
    @Size(min = 10, max = 1000, message = "Reason must be between 10 and 1000 characters")
    private String reason;

    private BigDecimal disputedAmount;
    private BigDecimal customerProposedAmount;
}
