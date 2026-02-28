package com.example.car_management.entity;

import com.example.car_management.entity.enums.FuelType;
import com.example.car_management.entity.enums.OwnerRegistrationStatus;
import com.example.car_management.entity.enums.Transmission;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "owner_registration_requests")
public class OwnerRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(name = "license_plate", nullable = false, length = 20)
    private String licensePlate;

    @Column(name = "brand_name", nullable = false, length = 50)
    private String brandName;

    @Column(name = "model_name", nullable = false, length = 50)
    private String modelName;

    @Column(name = "seat_count", nullable = false)
    private Integer seatCount;

    @Column(name = "manufacturing_year", nullable = false)
    private Integer manufacturingYear;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Transmission transmission;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", nullable = false, length = 20)
    private FuelType fuelType;

    @Column(name = "fuel_consumption", precision = 10, scale = 2)
    private BigDecimal fuelConsumption;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OwnerRegistrationStatus status;

    @Column(name = "admin_note", length = 500)
    private String adminNote;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private UserEntity reviewedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_owner_id")
    private UserEntity approvedOwner;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "owner_registration_features", joinColumns = @JoinColumn(name = "request_id"), inverseJoinColumns = @JoinColumn(name = "feature_id"))
    @Builder.Default
    private Set<VehicleFeatureEntity> features = new LinkedHashSet<>();
}
