package com.example.car_management.dto.response;

import com.example.car_management.entity.enums.BookingStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {
    private Integer id;
    private Integer vehicleId;
    private String vehicleName; // brandName + modelName
    private String vehicleImage; // Main image URL
    private Integer renterId;
    private String renterName;
    private String renterEmail;
    private Integer ownerId;
    private String ownerName;
    private String ownerPhone;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private BigDecimal totalPrice;
    private BookingStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    // Payment specific fields
    private BigDecimal depositAmount;
    private com.example.car_management.entity.enums.PaymentStatus paymentStatus;
    private String checkoutUrl;

    // Car handover & return tracking
    private Integer startKm;
    private Integer endKm;
    private Integer startFuelLevel;
    private Integer endFuelLevel;
    private BigDecimal surchargeAmount;
    private String returnNotes;
}
