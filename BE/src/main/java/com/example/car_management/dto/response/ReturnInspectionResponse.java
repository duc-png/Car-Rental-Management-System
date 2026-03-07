package com.example.car_management.dto.response;

import com.example.car_management.entity.enums.FuelLevel;
import com.example.car_management.entity.enums.ReturnStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnInspectionResponse {

    private Integer bookingId;
    private LocalDateTime scheduledEndDate;
    private LocalDateTime actualReturnDate;
    
    private Integer odometerStart;
    private Integer odometerEnd;
    private Integer distanceTraveled;
    
    private FuelLevel fuelLevelStart;
    private FuelLevel fuelLevelEnd;
    
    private String damageDescription;
    private List<String> damageImages;
    
    private BigDecimal lateFee;
    private BigDecimal fuelFee;
    private BigDecimal damageFee;
    private BigDecimal totalAdditionalFees;
    
    private BigDecimal originalPrice;
    private BigDecimal finalTotal;
    
    private ReturnStatus returnStatus;
    private String returnNotes;
    
    private Integer lateHours;
    private String lateFeeBreakdown;
    private String fuelFeeBreakdown;
}
