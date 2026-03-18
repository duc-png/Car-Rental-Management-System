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
public class VerifyOwnerEmailOtpRequest {

    @NotBlank(message = "OTP khong duoc de trong")
    @Size(min = 6, max = 6, message = "OTP phai gom 6 chu so")
    private String otp;
}
