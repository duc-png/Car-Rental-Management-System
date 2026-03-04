package com.example.car_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String licenseNumber;
    private String address;
    private Boolean isVerified;
    private Boolean isActive;
    private Instant createdAt;
    private String roleId;
}
