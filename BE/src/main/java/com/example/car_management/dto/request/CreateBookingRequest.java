package com.example.car_management.dto.request;

import com.example.car_management.validator.ValidDateRange;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@ValidDateRange(startDate = "startDate", endDate = "endDate", message = "End date must be after start date")
public class CreateBookingRequest {
    @NotNull(message = "Vehicle ID is required")
    Integer vehicleId;

    @NotNull(message = "Start date is required")
    @Future(message = "Start date must be in the future")
    LocalDateTime startDate;

    @NotNull(message = "End date is required")
    @Future(message = "End date must be in the future")
    LocalDateTime endDate;
}
