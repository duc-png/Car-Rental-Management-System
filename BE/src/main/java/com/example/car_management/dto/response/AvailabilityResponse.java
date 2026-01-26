package com.example.car_management.dto.response;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class AvailabilityResponse {
    private Integer vehicleId;
    private boolean available;
    private String reason; // "OVERLAP_BOOKING" / "OK"
}
