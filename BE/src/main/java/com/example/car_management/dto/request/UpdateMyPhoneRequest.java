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
public class UpdateMyPhoneRequest {

    @NotBlank(message = "Phone khong duoc de trong")
    @Size(min = 10, max = 15, message = "Phone khong hop le")
    private String phone;
}
