package com.example.car_management.dto.response;

import com.example.car_management.dto.response.BookedPeriodResponse;
import com.example.car_management.dto.response.BookingResponse;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleCalendarResponse {
    private Integer vehicleId;
    private List<BookedPeriodResponse> bookedPeriods;
}
