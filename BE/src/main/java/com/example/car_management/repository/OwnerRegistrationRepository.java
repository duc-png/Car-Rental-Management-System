package com.example.car_management.repository;

import com.example.car_management.entity.OwnerRegistration;
import com.example.car_management.entity.enums.OwnerRegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OwnerRegistrationRepository extends JpaRepository<OwnerRegistration, Integer> {
    boolean existsByEmailAndStatusIn(String email, List<OwnerRegistrationStatus> statuses);

    boolean existsByLicensePlateAndStatusIn(String licensePlate, List<OwnerRegistrationStatus> statuses);

    List<OwnerRegistration> findAllByStatusOrderByCreatedAtDesc(OwnerRegistrationStatus status);

    List<OwnerRegistration> findAllByOrderByCreatedAtDesc();

    Optional<OwnerRegistration> findFirstByEmailAndStatusOrderByCreatedAtDesc(
            String email,
            OwnerRegistrationStatus status
    );
}
