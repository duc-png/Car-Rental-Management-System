package com.example.car_management.repository;

import com.example.car_management.entity.IncidentReportEntity;
import com.example.car_management.entity.enums.IncidentReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface IncidentReportRepository extends JpaRepository<IncidentReportEntity, Integer> {

    List<IncidentReportEntity> findByCustomerIdOrderByCreatedAtDesc(Integer customerId);

    List<IncidentReportEntity> findByOwnerIdAndStatusInOrderByCreatedAtDesc(
            Integer ownerId,
            Collection<IncidentReportStatus> statuses);

    List<IncidentReportEntity> findByBookingIdOrderByCreatedAtDesc(Integer bookingId);
}
