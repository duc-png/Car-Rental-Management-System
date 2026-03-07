package com.example.car_management.entity;

import com.example.car_management.entity.enums.LicenseVerificationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "customer_licenses")
public class CustomerLicenseEntity {

    @Id
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "license_number", length = 50)
    private String licenseNumber;

    @Column(name = "license_full_name", length = 100)
    private String licenseFullName;

    @Column(name = "license_dob", length = 20)
    private String licenseDob;

    @Column(name = "nation", length = 100)
    private String nation;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "address_raw", length = 255)
    private String addressRaw;

    @Column(name = "issue_location", length = 150)
    private String issueLocation;

    @Column(name = "issue_date", length = 20)
    private String issueDate;

    @Column(name = "license_class", length = 30)
    private String licenseClass;

    @Column(name = "expiry_date", length = 20)
    private String expiryDate;

    @Column(name = "license_image_url", length = 500)
    private String licenseImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 20)
    private LicenseVerificationStatus verificationStatus;

    @Column(name = "verification_note", length = 255)
    private String verificationNote;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
