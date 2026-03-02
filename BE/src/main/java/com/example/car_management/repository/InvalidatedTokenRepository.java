package com.example.car_management.repository;

import com.example.car_management.entity.InvalidatedTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedTokenEntity, String> {
}
