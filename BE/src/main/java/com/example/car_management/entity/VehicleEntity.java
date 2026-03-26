package com.example.car_management.entity;

import com.example.car_management.entity.enums.FuelType;
import com.example.car_management.entity.enums.Transmission;
import com.example.car_management.entity.enums.VehicleStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "vehicles")
public class VehicleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // owner_id -> users.id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private UserEntity owner;

    // model_id -> vehicle_models.id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "model_id", nullable = false)
    private VehicleModelEntity model;

    @Column(name = "license_plate", nullable = false, unique = true, length = 20)
    private String licensePlate;

    @Column(length = 30)
    private String color;

    @Column(name = "seat_count")
    private Integer seatCount;

    @Enumerated(EnumType.STRING)
    private Transmission transmission;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type")
    private FuelType fuelType;

    @Column(name = "price_per_day", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerDay;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Enumerated(EnumType.STRING)
    private VehicleStatus status;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "year")
    private Integer year;

    @Column(name = "fuel_consumption")
    private Float fuelConsumption;

    @Column(name = "current_km", nullable = false)
    private Integer currentKm;

    @Column(name = "fuel_level")
    private Integer fuelLevel; // 0-100 (%)

    @Column(name = "delivery_enabled")
    @Builder.Default
    private Boolean deliveryEnabled = Boolean.TRUE;

    @Column(name = "free_delivery_within_km")
    private Integer freeDeliveryWithinKm;

    @Column(name = "max_delivery_distance_km")
    private Integer maxDeliveryDistanceKm;

    @Column(name = "extra_fee_per_km", precision = 12, scale = 2)
    private BigDecimal extraFeePerKm;

    // ===== Viewing Lock =====
    @Column(name = "viewing_locked_by_user_id")
    private Integer viewingLockedByUserId;

    @Column(name = "viewing_lock_expires_at")
    private Instant viewingLockExpiresAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private LocationEntity location;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<VehicleImageEntity> images = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "vehicle_feature_assignments", joinColumns = @JoinColumn(name = "vehicle_id"), inverseJoinColumns = @JoinColumn(name = "feature_id"))
    @Builder.Default
    private Set<VehicleFeatureEntity> features = new LinkedHashSet<>();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
