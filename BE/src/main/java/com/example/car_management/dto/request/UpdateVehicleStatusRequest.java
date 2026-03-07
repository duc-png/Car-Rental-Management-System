package com.example.car_management.dto.request;

import com.example.car_management.entity.enums.VehicleStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateVehicleStatusRequest {
    @NotNull
    private VehicleStatus status;
}
