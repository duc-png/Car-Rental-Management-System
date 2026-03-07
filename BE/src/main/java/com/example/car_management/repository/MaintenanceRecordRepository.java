package com.example.car_management.repository;

import com.example.car_management.entity.MaintenanceRecordEntity;
import com.example.car_management.entity.enums.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecordEntity, Integer> {

    List<MaintenanceRecordEntity> findByVehicleIdOrderByCreatedAtDesc(Integer vehicleId);

    List<MaintenanceRecordEntity> findByCustomerIdOrderByCreatedAtDesc(Integer customerId);
    
    @Query("SELECT COUNT(m) > 0 FROM MaintenanceRecordEntity m " +
           "WHERE m.vehicle.id = :vehicleId " +
           "AND m.status IN (:statuses)")
    boolean existsByVehicleIdAndStatusIn(@Param("vehicleId") Integer vehicleId, 
                                         @Param("statuses") List<MaintenanceStatus> statuses);
}

