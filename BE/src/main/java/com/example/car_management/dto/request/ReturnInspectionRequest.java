package com.example.car_management.dto.request;

import com.example.car_management.entity.enums.FuelLevel;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnInspectionRequest {

    @NotNull(message = "Actual return date is required")
    private LocalDateTime actualReturnDate;

    @NotNull(message = "Odometer start reading is required")
    @Min(value = 0, message = "Odometer start must be non-negative")
    private Integer odometerStart;

    @NotNull(message = "Odometer end reading is required")
    @Min(value = 0, message = "Odometer end must be non-negative")
    private Integer odometerEnd;

    @NotNull(message = "Fuel level at start is required")
    private FuelLevel fuelLevelStart;

    @NotNull(message = "Fuel level at end is required")
    private FuelLevel fuelLevelEnd;

    private String damageDescription;

    private List<String> damageImages;

    @Min(value = 0, message = "Damage fee must be non-negative")
    private BigDecimal damageFee;

    private String returnNotes;
}
