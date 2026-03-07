package com.example.car_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMyLicenseInfoRequest {

    @NotBlank(message = "Name khong duoc de trong")
    @Size(min = 2, max = 100, message = "Name phai tu 2-100 ky tu")
    private String licenseFullName;

    @NotBlank(message = "So GPLX khong duoc de trong")
    @Size(max = 50, message = "So GPLX toi da 50 ky tu")
    private String licenseNumber;

    @Size(max = 20, message = "Ngay sinh GPLX toi da 20 ky tu")
    private String birthDate;

    @Size(max = 100, message = "Quoc tich toi da 100 ky tu")
    private String nation;

    @Size(max = 255, message = "Dia chi toi da 255 ky tu")
    private String address;

    @Size(max = 255, message = "Dia chi raw toi da 255 ky tu")
    private String addressRaw;

    @Size(max = 150, message = "Noi cap toi da 150 ky tu")
    private String issueLocation;

    @Size(max = 20, message = "Ngay cap toi da 20 ky tu")
    private String issueDate;

    @Size(max = 30, message = "Hang GPLX toi da 30 ky tu")
    private String licenseClass;

    @Size(max = 20, message = "Ngay het han toi da 20 ky tu")
    private String expiryDate;

    @Size(max = 500, message = "Anh GPLX khong hop le")
    private String licenseImageUrl;
}
