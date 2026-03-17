package com.example.car_management.dto.request;

import com.example.car_management.entity.enums.BookingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateBookingStatusRequest {
    @NotNull(message = "Status is required")
    private BookingStatus status;
}
