package com.example.car_management.repository;

import com.example.car_management.entity.PaymentEntity;
import com.example.car_management.entity.enums.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentRepository extends JpaRepository<PaymentEntity, Integer> {

    List<PaymentEntity> findByBookingId(Integer bookingId);

    // Calculate total earnings for an owner (sum of all SUCCESS payments for their
    // bookings)
    @Query("""
                select coalesce(sum(p.amount), 0)
                from PaymentEntity p
                where p.booking.vehicle.owner.id = :ownerId
                  and p.status = :status
            """)
    BigDecimal sumAmountByOwnerIdAndStatus(
            @Param("ownerId") Integer ownerId,
            @Param("status") TransactionStatus status);
}
