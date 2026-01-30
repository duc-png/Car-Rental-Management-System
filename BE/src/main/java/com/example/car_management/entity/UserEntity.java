package com.example.car_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
<<<<<<< HEAD
=======
import java.util.HashSet;
import java.util.Set;
>>>>>>> ducmito

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

    @Column(name = "license_number", length = 50)
    private String licenseNumber;

    @Column(name = "is_verified")
    private Boolean isVerified;

    @Column(name = "created_at")
    private Instant createdAt;
<<<<<<< HEAD
=======

    // Many-to-Many with Role
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    @Builder.Default
    private Set<RoleEntity> roles = new HashSet<>();
>>>>>>> ducmito
}
