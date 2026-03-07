package com.example.car_management.repository;

import com.example.car_management.entity.LocationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationRepository extends JpaRepository<LocationEntity, Integer> {
}
