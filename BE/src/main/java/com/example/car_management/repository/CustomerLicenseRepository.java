package com.example.car_management.repository;

import com.example.car_management.entity.CustomerLicenseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CustomerLicenseRepository extends JpaRepository<CustomerLicenseEntity, Integer> {
    Optional<CustomerLicenseEntity> findByUserId(Integer userId);

    Optional<CustomerLicenseEntity> findByLicenseNumber(String licenseNumber);

    List<CustomerLicenseEntity> findByUserIdIn(Collection<Integer> userIds);
}
