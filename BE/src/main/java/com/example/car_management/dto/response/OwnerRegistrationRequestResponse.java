package com.example.car_management.dto.response;

import com.example.car_management.entity.enums.FuelType;
import com.example.car_management.entity.enums.OwnerRegistrationStatus;
import com.example.car_management.entity.enums.Transmission;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerRegistrationRequestResponse {
    private Integer requestId;

    private String fullName;
    private String email;
    private String phone;

    private String licensePlate;
    private String brandName;
    private String modelName;
    private Integer seatCount;
    private Integer manufacturingYear;
    private Transmission transmission;
    private FuelType fuelType;
    private String addressDetail;
    private BigDecimal fuelConsumption;
    private String description;

    private OwnerRegistrationStatus status;
    private String adminNote;
    private Instant createdAt;
    private Instant reviewedAt;

    private Integer reviewedById;
    private String reviewedByName;
    private Integer approvedOwnerId;
    private List<String> vehicleImageUrls;
    private List<VehicleFeatureResponse> features;
}
