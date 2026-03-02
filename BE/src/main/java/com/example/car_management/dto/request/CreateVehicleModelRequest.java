package com.example.car_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateVehicleModelRequest {

    @NotBlank
    @Size(max = 50)
    private String brandName;

    @NotBlank
    @Size(max = 50)
    private String modelName;

    @Size(max = 50)
    private String typeName;
}
