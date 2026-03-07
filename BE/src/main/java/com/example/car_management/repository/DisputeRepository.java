package com.example.car_management.repository;

import com.example.car_management.entity.DisputeEntity;
import com.example.car_management.entity.enums.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<DisputeEntity, Integer> {

    Optional<DisputeEntity> findByBookingId(Integer bookingId);

    @Query("SELECT d FROM DisputeEntity d WHERE d.customer.id = :userId OR d.owner.id = :userId ORDER BY d.createdAt DESC")
    List<DisputeEntity> findByUserId(@Param("userId") Integer userId);

    List<DisputeEntity> findByStatus(DisputeStatus status);

    @Query("SELECT d FROM DisputeEntity d WHERE d.booking.id = :bookingId AND d.status IN :statuses")
    List<DisputeEntity> findActiveDisputesByBookingId(@Param("bookingId") Integer bookingId, @Param("statuses") List<DisputeStatus> statuses);
}
