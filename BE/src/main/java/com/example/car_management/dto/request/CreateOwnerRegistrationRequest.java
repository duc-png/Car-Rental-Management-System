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
public class CreateOwnerRegistrationRequest {

    @NotNull
    @Valid
    private OwnerInfo owner;

    @NotNull
    @Valid
    private VehicleInfo vehicle;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OwnerInfo {
        @NotBlank
        @Email
        @Size(max = 100)
        private String email;

        @NotBlank
        @Size(max = 20)
        private String phone;

        @NotBlank
        @Size(max = 100)
        private String fullName;

        @NotBlank
        @Size(min = 6, max = 100)
        private String password;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VehicleInfo {
        @NotBlank
        @Size(max = 20)
        private String licensePlate;

        @NotBlank
        @Size(max = 50)
        private String brand;

        @NotBlank
        @Size(max = 50)
        private String model;

        @NotNull
        @Min(1)
        @Max(100)
        private Integer seatCount;

        @NotNull
        @Min(1980)
        @Max(2100)
        private Integer manufacturingYear;

        @NotNull
        private Transmission transmission;

        @NotNull
        private FuelType fuelType;

        @NotNull
        @DecimalMin(value = "0.0", inclusive = false)
        private BigDecimal pricePerDay;

        @NotBlank
        @Size(max = 255)
        private String addressDetail;

        @Builder.Default
        private Boolean discountEnabled = Boolean.FALSE;

        @DecimalMin(value = "0.0", inclusive = true)
        @DecimalMax(value = "100.0", inclusive = true)
        private BigDecimal discountPercent;

        @Builder.Default
        private Boolean instantBooking = Boolean.TRUE;

        @Builder.Default
        private Boolean deliveryEnabled = Boolean.TRUE;

        @Min(0)
        private Integer freeDeliveryWithinKm;

        @Min(0)
        private Integer maxDeliveryDistanceKm;

        @Min(0)
        private Integer maxKmPerDay;

        @DecimalMin(value = "0.0", inclusive = true)
        private BigDecimal extraFeePerKm;

        @Size(max = 2000)
        private String rentalTerms;

        @DecimalMin(value = "0.0", inclusive = false)
        private BigDecimal fuelConsumption;

        @Size(max = 2000)
        private String description;

        private List<Integer> featureIds;
    }
}
