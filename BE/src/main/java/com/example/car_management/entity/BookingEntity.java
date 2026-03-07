package com.example.car_management.entity;

import com.example.car_management.entity.enums.BookingStatus;
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

    // customer_id -> users.id
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
    private BookingStatus status;

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

    @Column(name = "return_notes", length = 1000)
    private String returnNotes;
}
