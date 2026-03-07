package com.example.car_management.dto.response;

import com.example.car_management.entity.enums.BookingStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerBookingCalendarItemResponse {
    private Integer bookingId;
    private Integer vehicleId;
    private String vehicleName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private BookingStatus status;
}
