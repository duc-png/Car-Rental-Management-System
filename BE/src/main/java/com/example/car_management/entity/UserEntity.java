package com.example.car_management.entity;

import com.example.car_management.entity.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(length = 20)
    private String phone;

    @Column(length = 500)
    private String avatar;

    @Column(length = 255)
    private String address;

    @Column(name = "is_verified")
    private Boolean isVerified;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "created_at")
    private Instant createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_id", length = 20)
    private UserRole roleId;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "customer_favorites", joinColumns = @JoinColumn(name = "customer_id"), inverseJoinColumns = @JoinColumn(name = "vehicle_id"))
    @Builder.Default
    private Set<VehicleEntity> favoriteVehicles = new LinkedHashSet<>();
}
