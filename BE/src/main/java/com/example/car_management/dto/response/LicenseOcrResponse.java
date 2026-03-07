package com.example.car_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LicenseOcrResponse {
    private String licenseNumber;
    private String licenseFullName;
    private String birthDate;
    private String nation;
    private String address;
    private String addressRaw;
    private String issueLocation;
    private String issueDate;
    private String licenseClass;
    private String expiryDate;
    private String documentType;
    private String licenseNumberConfidence;
    private String licenseFullNameConfidence;
    private String birthDateConfidence;
    private String licenseImageUrl;
}
