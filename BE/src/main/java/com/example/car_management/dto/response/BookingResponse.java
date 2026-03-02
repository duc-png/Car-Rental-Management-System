package com.example.car_management.dto.response;

import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.entity.enums.FuelLevel;
import com.example.car_management.entity.enums.ReturnStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingResponse {
    private Integer id;
    private Integer vehicleId;
    private String vehicleName;
    private String vehicleImage;
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
    
    // Return inspection fields
    private LocalDateTime actualReturnDate;
    private Integer odometerStart;
    private Integer odometerEnd;
    private FuelLevel fuelLevelStart;
    private FuelLevel fuelLevelEnd;
    
    // Additional fees
    private BigDecimal lateFee;
    private BigDecimal fuelFee;
    private BigDecimal damageFee;
    private BigDecimal totalAdditionalFees;
    private String damageDescription;
    private List<String> damageImages;
    
    // Return status
    private ReturnStatus returnStatus;
    private String returnNotes;
    
    // Dispute info
    private Integer disputeId;
    private String disputeStatus;
}
