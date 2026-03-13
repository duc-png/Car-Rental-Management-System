package com.example.car_management.repository;

import com.example.car_management.entity.PaymentEntity;
import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.entity.enums.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    // ----- Reports: cash collected revenue (grouped by booking.startDate) -----

    @Query("""
                select coalesce(sum(p.amount), 0)
                from PaymentEntity p
                join p.booking b
                where p.status = :status
                  and b.status in :statuses
                  and b.startDate >= :from
                  and b.startDate < :to
                  and (:ownerId is null or b.vehicle.owner.id = :ownerId)
            """)
    BigDecimal sumCashRevenueByDateRange(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("statuses") List<BookingStatus> statuses,
            @Param("ownerId") Integer ownerId,
            @Param("status") TransactionStatus status);

    @Query("""
                select b.startDate, p.amount
                from PaymentEntity p
                join p.booking b
                where p.status = :status
                  and b.status in :statuses
                  and b.startDate >= :from
                  and b.startDate < :to
                  and (:ownerId is null or b.vehicle.owner.id = :ownerId)
            """)
    List<Object[]> findCashRevenueEntriesByBookingStartDate(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("statuses") List<BookingStatus> statuses,
            @Param("ownerId") Integer ownerId,
            @Param("status") TransactionStatus status);
}
