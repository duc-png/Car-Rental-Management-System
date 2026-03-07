package com.example.car_management.dto.response;

import com.example.car_management.entity.enums.DisputeStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisputeResponse {

    private Integer id;
    private Integer bookingId;
    
    private Integer customerId;
    private String customerName;
    private String customerEmail;
    
    private Integer ownerId;
    private String ownerName;
    private String ownerEmail;
    
    private String reason;
    private BigDecimal disputedAmount;
    private DisputeStatus status;
    
    private String resolutionNotes;
    private BigDecimal finalAmount;
    
    private Instant createdAt;
    private Instant updatedAt;
    private Instant resolvedAt;
    
    private String vehicleName;
    private BigDecimal originalFees;
}
