package com.example.car_management.entity;

import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.entity.enums.FuelLevel;
import com.example.car_management.entity.enums.ReturnStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "bookings")
public class BookingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private UserEntity customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private VehicleEntity vehicle;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(name = "total_price", precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private BookingStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "return_status")
    private ReturnStatus returnStatus;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "pickup_location", length = 255)
    private String pickupLocation;

    @Column(name = "return_location", length = 255)
    private String returnLocation;

    // Payment integration fields
    @Column(name = "deposit_amount", precision = 12, scale = 2)
    private BigDecimal depositAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    private com.example.car_management.entity.enums.PaymentStatus paymentStatus;

    @Column(name = "payos_deposit_order_code")
    private Long payosDepositOrderCode;

    @Column(name = "payos_full_order_code")
    private Long payosFullOrderCode;

    @Column(name = "payos_penalty_order_code")
    private Long payosPenaltyOrderCode;

    @Column(name = "checkout_url", length = 500)
    private String checkoutUrl;

    // Car handover & return tracking
    @Column(name = "start_km")
    private Integer startKm;

    @Column(name = "end_km")
    private Integer endKm;

    @Column(name = "start_fuel_level")
    private Integer startFuelLevel; // 0-100 (%)

    @Column(name = "end_fuel_level")
    private Integer endFuelLevel; // 0-100 (%)

    @Column(name = "surcharge_amount", precision = 12, scale = 2)
    private BigDecimal surchargeAmount;

    // ============ Return Inspection Fields ============
    
    @Column(name = "actual_return_date")
    private LocalDateTime actualReturnDate;

    @Column(name = "odometer_start")
    private Integer odometerStart;

    @Column(name = "odometer_end")
    private Integer odometerEnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_level_start")
    private FuelLevel fuelLevelStart;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_level_end")
    private FuelLevel fuelLevelEnd;

    // ============ Additional Fees ============
    
    @Column(name = "late_fee", precision = 12, scale = 2)
    private BigDecimal lateFee;

    @Column(name = "fuel_fee", precision = 12, scale = 2)
    private BigDecimal fuelFee;

    @Column(name = "damage_fee", precision = 12, scale = 2)
    private BigDecimal damageFee;

    @Column(name = "total_additional_fees", precision = 12, scale = 2)
    private BigDecimal totalAdditionalFees;

    @Column(name = "damage_description", length = 1000)
    private String damageDescription;

    @ElementCollection
    @CollectionTable(name = "booking_damage_images", joinColumns = @JoinColumn(name = "booking_id"))
    @Column(name = "image_url")
    private java.util.List<String> damageImages;

    // ============ Voucher ============

    @Column(name = "voucher_code", length = 8)
    private String voucherCode;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount;

    // Customer handover confirmation — set to true when customer confirms they've
    @Column(name = "customer_confirmed_handover")
    @Builder.Default
    private Boolean customerConfirmedHandover = false;
}
