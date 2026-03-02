package com.example.car_management.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerPublicProfileResponse {
    private OwnerProfileResponse owner;
    private List<VehicleResponse> vehicles;
    private List<OwnerReceivedReviewResponse> receivedReviews;
}
