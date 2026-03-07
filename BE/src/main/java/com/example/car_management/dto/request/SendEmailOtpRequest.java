package com.example.car_management.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendEmailOtpRequest {

    @NotBlank(message = "Email khong duoc de trong")
    @Email(message = "Email khong hop le")
    private String newEmail;
}
