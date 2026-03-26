package com.example.car_management.dto.request;

import com.example.car_management.entity.enums.FuelType;
import com.example.car_management.entity.enums.Transmission;
import com.example.car_management.validator.ValidVehicleYear;
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
    @DecimalMax(value = "10000000.0", inclusive = true)
    private BigDecimal pricePerDay;

    @Size(max = 2000)
    private String description;

    @ValidVehicleYear(min = 1900)
    private Integer year;

    @Positive
    private Float fuelConsumption;

    @Min(0)
    private Integer currentKm;

    @Builder.Default
    private Boolean deliveryEnabled = Boolean.TRUE;

    @Min(0)
    private Integer freeDeliveryWithinKm;

    @Min(0)
    private Integer maxDeliveryDistanceKm;

    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal extraFeePerKm;

    private Integer locationId;

    @Valid
    private LocationInputRequest location;

    private List<Integer> featureIds;
}
