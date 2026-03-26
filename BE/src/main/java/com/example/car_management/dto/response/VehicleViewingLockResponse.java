package com.example.car_management.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleViewingLockResponse {
    private boolean locked;
    private boolean lockedByMe;
    private Instant expiresAt;
    private String message;
}
