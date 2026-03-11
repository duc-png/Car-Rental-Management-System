package com.example.car_management.dto.response;

import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.entity.enums.DisputeStatus;
import com.example.car_management.entity.enums.PaymentStatus;
import com.example.car_management.entity.enums.PaymentType;
import com.example.car_management.entity.enums.ReturnStatus;
import com.example.car_management.entity.enums.TransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingJourneyResponse {
    private Integer bookingId;
    private BookingStatus bookingStatus;
    private PaymentStatus paymentStatus;
    private ReturnStatus returnStatus;

    private String vehicleName;
    private String vehiclePlate;
    private String customerName;
    private String ownerName;

    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Instant createdAt;
    private Instant updatedAt;

    private BigDecimal totalPrice;
    private BigDecimal depositAmount;
    private String checkoutUrl;

    private InspectionDetail inspection;
    private DisputeDetail dispute;
    private List<PaymentDetail> payments;
    private List<MessageDetail> disputeMessages;
    private List<TimelineEvent> timeline;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InspectionDetail {
        private LocalDateTime scheduledEndDate;
        private LocalDateTime actualReturnDate;
        private Integer odometerStart;
        private Integer odometerEnd;
        private Integer distanceTraveled;
        private Integer allowedKm;
        private Integer overKm;
        private BigDecimal lateFee;
        private BigDecimal fuelFee;
        private BigDecimal overKmFee;
        private BigDecimal damageFee;
        private BigDecimal totalAdditionalFees;
        private BigDecimal finalTotal;
        private String damageDescription;
        private String returnNotes;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DisputeDetail {
        private Integer disputeId;
        private DisputeStatus status;
        private String reason;
        private BigDecimal disputedAmount;
        private BigDecimal customerProposedAmount;
        private String customerCounterReason;
        private BigDecimal finalAmount;
        private String resolutionNotes;
        private Instant createdAt;
        private Instant updatedAt;
        private Instant resolvedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentDetail {
        private Integer paymentId;
        private PaymentType paymentType;
        private BigDecimal amount;
        private TransactionStatus status;
        private String transactionId;
        private Instant paymentDate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageDetail {
        private Integer messageId;
        private String senderName;
        private String receiverName;
        private String content;
        private Instant sentAt;
        private Boolean isRead;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TimelineEvent {
        private Instant time;
        private String type;
        private String title;
        private String detail;
    }
}
