package com.example.car_management.entity;

import com.example.car_management.entity.enums.FuelLevel;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "return_inspections")
public class ReturnInspectionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private BookingEntity booking;

    @Column(name = "scheduled_end_date", nullable = false)
    private LocalDateTime scheduledEndDate;

    @Column(name = "actual_return_date", nullable = false)
    private LocalDateTime actualReturnDate;

    @Column(name = "odometer_start", nullable = false)
    private Integer odometerStart;

    @Column(name = "odometer_end", nullable = false)
    private Integer odometerEnd;

    @Column(name = "distance_traveled", nullable = false)
    private Integer distanceTraveled;

    @Column(name = "allowed_km", nullable = false)
    private Integer allowedKm;

    @Column(name = "over_km", nullable = false)
    private Integer overKm;

    @Column(name = "over_km_fee", precision = 12, scale = 2, nullable = false)
    private BigDecimal overKmFee;

    @Column(name = "over_km_fee_breakdown", length = 255)
    private String overKmFeeBreakdown;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_level_start", nullable = false)
    private FuelLevel fuelLevelStart;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_level_end", nullable = false)
    private FuelLevel fuelLevelEnd;

    @Column(name = "late_hours", nullable = false)
    private Integer lateHours;

    @Column(name = "late_fee", precision = 12, scale = 2, nullable = false)
    private BigDecimal lateFee;

    @Column(name = "late_fee_breakdown", length = 255)
    private String lateFeeBreakdown;

    @Column(name = "fuel_fee", precision = 12, scale = 2, nullable = false)
    private BigDecimal fuelFee;

    @Column(name = "fuel_fee_breakdown", length = 255)
    private String fuelFeeBreakdown;

    @Column(name = "damage_description", columnDefinition = "TEXT")
    private String damageDescription;

    @Column(name = "damage_fee", precision = 12, scale = 2, nullable = false)
    private BigDecimal damageFee;

    @Column(name = "total_additional_fees", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalAdditionalFees;

    @Column(name = "original_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal originalPrice;

    @Column(name = "final_total", precision = 12, scale = 2, nullable = false)
    private BigDecimal finalTotal;

    @Column(name = "return_notes", columnDefinition = "TEXT")
    private String returnNotes;
}

