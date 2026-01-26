package com.example.car_management.repository;

import com.example.car_management.entity.VehicleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRepository extends JpaRepository<VehicleEntity, Integer> {
    boolean existsByLicensePlate(String licensePlate);
    boolean existsByLicensePlateAndIdNot(String licensePlate, Integer id);
    List<VehicleEntity> findByOwner_Id(Integer ownerId);
}
