package com.example.car_management.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerReceivedReviewResponse {
    private Integer reviewId;
    private Integer bookingId;
    private Integer vehicleId;
    private String vehicleName;

    private Integer reviewerId;
    private String reviewerName;

    private Integer vehicleRating;
    private String comment;
    private Instant createdAt;
}
