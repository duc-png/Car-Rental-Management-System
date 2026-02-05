package com.example.car_management.dto.request;

import jakarta.validation.constraints.Email;
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
public class CreateCustomerRequest {

    @NotBlank(message = "Name khong duoc de trong")
    @Size(min = 2, max = 100, message = "Name phai tu 2-100 ky tu")
    private String fullName;

    @NotBlank(message = "Email khong duoc de trong")
    @Email(message = "Email khong hop le")
    private String email;

    @NotBlank(message = "Phone khong duoc de trong")
    @Size(min = 10, max = 15, message = "Phone khong hop le")
    private String phone;

    private String licenseNumber;

    private String address;

    private String password;
}
