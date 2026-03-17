package com.example.car_management.repository;

import com.example.car_management.entity.VoucherEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<VoucherEntity, Integer> {

    Optional<VoucherEntity> findByCode(String code);

    Optional<VoucherEntity> findByCodeAndActiveTrue(String code);
}
