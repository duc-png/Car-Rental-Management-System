package com.example.car_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.example.car_management.entity.enums.LicenseVerificationStatus;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerResponse {
    private Integer id;
    private String fullName;
    private String birthDate;
    private String email;
    private String phone;
    private String licenseNumber;
    private String licenseFullName;
    private String licenseDob;
    private String nation;
    private String licenseAddress;
    private String licenseAddressRaw;
    private String issueLocation;
    private String issueDate;
    private String licenseClass;
    private String expiryDate;
    private String licenseImageUrl;
    private LicenseVerificationStatus licenseVerificationStatus;
    private String licenseVerificationNote;
    private Instant licenseVerifiedAt;
    private String avatar;
    private String address;
    private Boolean isActive;
    private Instant createdAt;
    private Long totalBookings;
    private BigDecimal totalRevenue;
}
