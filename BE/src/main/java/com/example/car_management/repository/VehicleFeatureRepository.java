package com.example.car_management.repository;

import com.example.car_management.entity.VehicleFeatureEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleFeatureRepository extends JpaRepository<VehicleFeatureEntity, Integer> {
    List<VehicleFeatureEntity> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);
}
