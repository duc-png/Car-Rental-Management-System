package com.example.car_management.dto.response;

import com.example.car_management.entity.enums.FuelType;
import com.example.car_management.entity.enums.Transmission;
import com.example.car_management.entity.enums.VehicleStatus;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class VehicleResponse {
    private Integer id;
    private Integer ownerId;
    private Integer modelId;

    private String modelName;
    private String brandName;
    private String carTypeName;

    private String licensePlate;
    private String color;
    private Integer seatCount;
    private Transmission transmission;
    private FuelType fuelType;

    private BigDecimal pricePerDay;
    private VehicleStatus status;
    private Integer currentKm;

    private Integer locationId;
    private String city;
    private String district;
    private String addressDetail;

    // ===== ADD FOR RENTER VIEW =====
    private String ownerName;
    private String ownerPhone;
    private String ownerEmail;

    private String mainImageUrl;

    private List<VehicleImageResponse> images;
}
