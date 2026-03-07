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
public class UpdateMyBasicInfoRequest {

    @NotBlank(message = "Name khong duoc de trong")
    @Size(min = 2, max = 100, message = "Name phai tu 2-100 ky tu")
    private String fullName;
}
