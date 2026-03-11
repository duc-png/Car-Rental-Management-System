package com.example.car_management.dto.response;

import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.entity.enums.ReturnStatus;
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
    private String vehicleName;
    private String vehicleImage;
    private Integer vehicleCurrentKm;
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

    // Payment fields
    private BigDecimal depositAmount;
    private com.example.car_management.entity.enums.PaymentStatus paymentStatus;
    private String checkoutUrl;

    // Handover confirmation
    private Boolean customerConfirmedHandover;

    // Return / penalty tracking
    private ReturnStatus returnStatus;
}
