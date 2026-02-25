package com.example.car_management.repository;

import com.example.car_management.entity.BookingEntity;
import com.example.car_management.entity.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<BookingEntity, Integer> {

        @Query("""
                            select b from BookingEntity b
                            where b.vehicle.id = :vehicleId
                              and b.status in :activeStatuses
                              and (b.startDate < :to and b.endDate > :from)
                        """)
        List<BookingEntity> findOverlappingBookings(
                        @Param("vehicleId") Integer vehicleId,
                        @Param("from") LocalDateTime from,
                        @Param("to") LocalDateTime to,
                        @Param("activeStatuses") List<BookingStatus> activeStatuses);

        @Query("""
                            select b from BookingEntity b
                            where b.vehicle.id = :vehicleId
                              and b.status in :activeStatuses
                              and b.endDate > :now
                        """)
        List<BookingEntity> findByVehicleIdAndStatusInAndEndDateAfter(
                        @Param("vehicleId") Integer vehicleId,
                        @Param("activeStatuses") List<BookingStatus> activeStatuses,
                        @Param("now") LocalDateTime now);

        @Query("""
                            select distinct b from BookingEntity b
                            join fetch b.vehicle v
                            join fetch v.model m
                            join fetch m.brand
                            join fetch v.owner
                            left join fetch v.images
                            join fetch b.customer
                            where b.customer.id = :userId or v.owner.id = :userId
                            order by b.createdAt desc
                        """)
        List<BookingEntity> findByRenterIdOrOwnerId(@Param("userId") Integer userId);

        @Query("""
                            select b from BookingEntity b
                            where b.status = :status
                              and b.paymentStatus = :paymentStatus
                              and b.updatedAt <= :expiryTime
                        """)
        List<BookingEntity> findByStatusAndPaymentStatusAndUpdatedAtBefore(
                        @Param("status") BookingStatus status,
                        @Param("paymentStatus") com.example.car_management.entity.enums.PaymentStatus paymentStatus,
                        @Param("expiryTime") java.time.Instant expiryTime);

        @Query("""
                            select b from BookingEntity b
                            where b.payosDepositOrderCode = :orderCode
                               or b.payosFullOrderCode = :orderCode
                        """)
        Optional<BookingEntity> findByPayosOrderCode(@Param("orderCode") Long orderCode);
}
