package com.example.car_management.dto.request;

import com.example.car_management.entity.enums.BookingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateBookingStatusRequest {
    @NotNull(message = "Status is required")
    private BookingStatus status;

    // For ONGOING transition (Start Trip)
    private Integer startKm;
    private Integer startFuelLevel;

    // For COMPLETED transition (Return Car)
    private Integer endKm;
    private Integer endFuelLevel;
    private BigDecimal otherSurcharge; // Additional surcharge (damages, cleaning, etc.)
    private String returnNotes;
    private LocalDateTime actualReturnTime; // Actual time car was returned (for late return penalty)
}
