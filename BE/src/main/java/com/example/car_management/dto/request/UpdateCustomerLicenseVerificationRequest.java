package com.example.car_management.dto.request;

import com.example.car_management.entity.enums.LicenseVerificationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCustomerLicenseVerificationRequest {

    @NotNull(message = "Status khong duoc de trong")
    private LicenseVerificationStatus status;

    private String note;
}
