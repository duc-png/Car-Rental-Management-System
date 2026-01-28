package com.example.car_management.repository;

import com.example.car_management.entity.VehicleModelEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleModelRepository extends JpaRepository<VehicleModelEntity, Integer> {
}
