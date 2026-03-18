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
    private String avatar;
    private Boolean isVerified;
    private Boolean isActive;
    private Instant joinedAt;

    private Double avgRating;
    private Long totalReviews;
    private Long totalTrips;

    // Performance metrics computed from database records.
    private Integer responseRate;
    private Integer responseTimeMinutes;
    private Integer approvalRate;
}
