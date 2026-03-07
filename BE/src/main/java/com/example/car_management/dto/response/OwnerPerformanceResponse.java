package com.example.car_management.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerPerformanceResponse {
    private Integer ownerId;
    private Double avgRating;
    private Long totalReviews;
    private Long totalTrips;
    private Integer responseRate;
    private Integer responseTimeMinutes;
    private Integer approvalRate;
}
