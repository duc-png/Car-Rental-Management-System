package com.example.car_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CounterOfferRequest {

    @NotNull(message = "Counter amount is required")
    private BigDecimal counterAmount;

    @NotBlank(message = "Counter reason is required")
    private String counterReason;
}
