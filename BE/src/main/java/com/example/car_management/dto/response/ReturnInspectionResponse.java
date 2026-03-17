package com.example.car_management.dto.response;

import com.example.car_management.entity.enums.FuelLevel;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ReturnInspectionResponse {

    private Integer bookingId;
    private LocalDateTime scheduledEndDate;
    private LocalDateTime actualReturnDate;

    private Integer lateHours;
    private BigDecimal lateFee;
    private String lateFeeBreakdown;

    private Integer distanceTraveled;
    private Integer allowedKm;
    private Integer overKm;
    private BigDecimal overKmFee;
    private String overKmFeeBreakdown;

    private FuelLevel fuelLevelStart;
    private FuelLevel fuelLevelEnd;
    private BigDecimal fuelFee;
    private String fuelFeeBreakdown;

    private String damageDescription;
    private BigDecimal damageFee;
    private List<String> damageImages;

    private String returnNotes;

    private BigDecimal totalAdditionalFees;
    private BigDecimal originalPrice;
    private BigDecimal finalTotal;

    private String penaltyCheckoutUrl;
}

