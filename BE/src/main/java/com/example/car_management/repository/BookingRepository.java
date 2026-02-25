package com.example.car_management.repository;

import com.example.car_management.entity.BookingEntity;
import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.entity.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<BookingEntity, Integer> {


    // Check overlapping bookings
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
            @Param("activeStatuses") List<BookingStatus> activeStatuses
    );


    // Active bookings for vehicle
    @Query("""
            select b from BookingEntity b
            where b.vehicle.id = :vehicleId
              and b.status in :activeStatuses
              and b.endDate > :now
           """)
    List<BookingEntity> findByVehicleIdAndStatusInAndEndDateAfter(
            @Param("vehicleId") Integer vehicleId,
            @Param("activeStatuses") List<BookingStatus> activeStatuses,
            @Param("now") LocalDateTime now
    );


    // Fetch bookings of renter or owner
    @Query("""
            select distinct b from BookingEntity b
            join fetch b.vehicle v
            join fetch v.model m
            join fetch m.brand
            join fetch v.owner
            left join fetch v.images
            join fetch b.customer
            where b.customer.id = :userId
               or v.owner.id = :userId
            order by b.createdAt desc
           """)
    List<BookingEntity> findByRenterIdOrOwnerId(
            @Param("userId") Integer userId
    );


    // Auto cancel expired deposit
    @Query("""
            select b from BookingEntity b
            where b.status = :status
              and b.paymentStatus = :paymentStatus
              and b.updatedAt <= :expiryTime
           """)
    List<BookingEntity> findByStatusAndPaymentStatusAndUpdatedAtBefore(
            @Param("status") BookingStatus status,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("expiryTime") Instant expiryTime
    );


    // Find booking by PayOS orderCode
    @Query("""
            select b from BookingEntity b
            where b.payosDepositOrderCode = :orderCode
               or b.payosFullOrderCode = :orderCode
           """)
    Optional<BookingEntity> findByPayosOrderCode(
            @Param("orderCode") Long orderCode
    );


    // Admin dashboard summary
    @Query("""
            select b.customer.id as customerId,
                   count(b.id) as totalBookings,
                   coalesce(sum(b.totalPrice), 0) as totalRevenue
            from BookingEntity b
            where b.customer.id in :customerIds
            group by b.customer.id
           """)
    List<CustomerBookingSummary> summarizeByCustomerIds(
            @Param("customerIds") Collection<Integer> customerIds
    );


    // Owner trips statistics
    @Query("""
            select count(b.id)
            from BookingEntity b
            where b.vehicle.owner.id = :ownerId
              and b.status = :status
           """)
    long countOwnerTripsByStatus(
            @Param("ownerId") Integer ownerId,
            @Param("status") BookingStatus status
    );

}