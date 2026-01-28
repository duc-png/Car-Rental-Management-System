package com.example.car_management.dto.request;

import com.example.car_management.entity.enums.FuelType;
import com.example.car_management.entity.enums.Transmission;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateVehicleRequest {

    private Integer modelId;

    @Size(max = 20)
    private String licensePlate;

    @Size(max = 30)
    private String color;

    @Min(1)
    private Integer seatCount;

    private Transmission transmission;
    private FuelType fuelType;

    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal pricePerDay;

    @Min(0)
    private Integer currentKm;

    private Integer locationId;
}
