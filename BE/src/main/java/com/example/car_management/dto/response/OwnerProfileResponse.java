package com.example.car_management.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerProfileResponse {
    private Integer ownerId;
    private String fullName;
    private String phone;
    private String email;
    private Boolean isVerified;
    private Instant joinedAt;

    private Double avgRating;
    private Long totalReviews;
    private Long totalTrips;
}
