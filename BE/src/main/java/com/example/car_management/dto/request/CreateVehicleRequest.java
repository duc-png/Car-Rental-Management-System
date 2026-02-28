package com.example.car_management.dto.request;

import com.example.car_management.entity.enums.FuelType;
import com.example.car_management.entity.enums.Transmission;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateVehicleRequest {

    @NotNull
    private Integer ownerId;

    @NotNull
    private Integer modelId;

    @NotBlank
    @Size(max = 20)
    private String licensePlate;

    @Size(max = 30)
    private String color;

    @Min(1)
    private Integer seatCount;

    private Transmission transmission;
    private FuelType fuelType;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal pricePerDay;

    @Size(max = 2000)
    private String description;

    @Min(1900)
    private Integer year;

    @Positive
    private Float fuelConsumption;

    @Min(0)
    private Integer currentKm;

    private Integer locationId;

    @Valid
    private LocationInputRequest location;

    private List<Integer> featureIds;
}
