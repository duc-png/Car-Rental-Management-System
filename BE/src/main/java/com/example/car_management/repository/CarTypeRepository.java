package com.example.car_management.repository;

import com.example.car_management.entity.CarTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CarTypeRepository extends JpaRepository<CarTypeEntity, Integer> {
    Optional<CarTypeEntity> findByNameIgnoreCase(String name);
}
