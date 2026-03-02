package com.example.car_management.repository;

import com.example.car_management.entity.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Integer> {
    List<NotificationEntity> findByUser_IdOrderByCreatedAtDesc(Integer userId);

    List<NotificationEntity> findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(Integer userId);

    long countByUser_IdAndIsReadFalse(Integer userId);
}
