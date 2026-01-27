package com.example.car_management.repository;

import com.example.car_management.entity.VehicleImageEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleImageRepository extends JpaRepository<VehicleImageEntity, Integer> {
    List<VehicleImageEntity> findByVehicle_Id(Integer vehicleId);
}
