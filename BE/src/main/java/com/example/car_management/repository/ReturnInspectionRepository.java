package com.example.car_management.repository;

import com.example.car_management.entity.ReturnInspectionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReturnInspectionRepository extends JpaRepository<ReturnInspectionEntity, Integer> {

    Optional<ReturnInspectionEntity> findByBookingId(Integer bookingId);

    boolean existsByBookingId(Integer bookingId);
}

