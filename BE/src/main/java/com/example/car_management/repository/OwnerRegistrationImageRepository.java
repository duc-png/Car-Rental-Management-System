package com.example.car_management.repository;

import com.example.car_management.entity.OwnerRegistrationImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OwnerRegistrationImageRepository extends JpaRepository<OwnerRegistrationImage, Integer> {
    List<OwnerRegistrationImage> findByRequest_IdOrderByIdAsc(Integer requestId);
}
