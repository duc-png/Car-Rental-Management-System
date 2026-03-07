package com.example.car_management.repository;

import com.example.car_management.entity.BookingEntity;
import com.example.car_management.entity.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
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

  // From HEAD: query active bookings for vehicle
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

  // From HEAD: fetch-join query for user bookings (renter or owner)
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

  // From HEAD: auto-cancel expired deposit bookings
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

  // From HEAD: find booking by PayOS order code (deposit or full)
  @Query("""
          select b from BookingEntity b
          where b.payosDepositOrderCode = :orderCode
             or b.payosFullOrderCode = :orderCode
      """)
  Optional<BookingEntity> findByPayosOrderCode(@Param("orderCode") Long orderCode);

  // From remote: customer booking summary for admin dashboard
  @Query("""
          select b.customer.id as customerId,
                 count(b.id) as totalBookings,
                 coalesce(sum(b.totalPrice), 0) as totalRevenue
          from BookingEntity b
          where b.customer.id in :customerIds
          group by b.customer.id
      """)
  List<CustomerBookingSummary> summarizeByCustomerIds(@Param("customerIds") Collection<Integer> customerIds);

  // Find competing PENDING bookings for the same vehicle/date range (to cancel
  // when one is confirmed)
  @Query("""
          select b from BookingEntity b
          where b.vehicle.id = :vehicleId
            and b.id <> :excludeBookingId
            and b.status = com.example.car_management.entity.enums.BookingStatus.PENDING
            and (b.startDate < :endDate and b.endDate > :startDate)
      """)
  List<BookingEntity> findCompetingPendingBookings(
      @Param("vehicleId") Integer vehicleId,
      @Param("excludeBookingId") Integer excludeBookingId,
      @Param("startDate") LocalDateTime startDate,
      @Param("endDate") LocalDateTime endDate);

  @Query("""
              select count(b.id)
              from BookingEntity b
              where b.vehicle.owner.id = :ownerId
                  and b.status = :status
      """)
  long countOwnerTripsByStatus(@Param("ownerId") Integer ownerId, @Param("status") BookingStatus status);

  @Query("""
          select b from BookingEntity b
          join fetch b.vehicle v
          join fetch v.model m
          join fetch m.brand
          where v.owner.id = :ownerId
            and (:vehicleId is null or v.id = :vehicleId)
            and b.status in :statuses
            and (b.startDate < :to and b.endDate > :from)
          order by b.startDate asc
      """)
  List<BookingEntity> findOwnerBookingsForCalendar(
      @Param("ownerId") Integer ownerId,
      @Param("vehicleId") Integer vehicleId,
      @Param("from") LocalDateTime from,
      @Param("to") LocalDateTime to,
      @Param("statuses") List<BookingStatus> statuses);

  @Query("""
      select count(b.id)
      from BookingEntity b
      where b.vehicle.owner.id = :ownerId
      """)
  long countOwnerBookings(@Param("ownerId") Integer ownerId);

  @Query("""
      select count(b.id)
      from BookingEntity b
      where b.vehicle.owner.id = :ownerId
        and b.status in :statuses
      """)
  long countOwnerBookingsByStatuses(
      @Param("ownerId") Integer ownerId,
      @Param("statuses") Collection<BookingStatus> statuses);
        @Query("""
                                select count(b.id)
                                from BookingEntity b
                                where b.vehicle.owner.id = :ownerId
                                    and b.status = :status
                        """)
        long countOwnerTripsByStatus(@Param("ownerId") Integer ownerId, @Param("status") BookingStatus status);

    // ----- Reports: revenue (status CONFIRMED, ONGOING, COMPLETED) -----
    @Query("""
                select coalesce(sum(b.totalPrice), 0) from BookingEntity b
                where b.status in :statuses
                  and b.startDate >= :from
                  and b.startDate < :to
                  and (:ownerId is null or b.vehicle.owner.id = :ownerId)
            """)
    BigDecimal sumRevenueByDateRange(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("statuses") List<BookingStatus> statuses,
            @Param("ownerId") Integer ownerId);

    @Query("""
                select year(b.startDate), month(b.startDate), sum(b.totalPrice)
                from BookingEntity b
                where b.status in :statuses
                  and b.startDate >= :from
                  and b.startDate < :to
                  and (:ownerId is null or b.vehicle.owner.id = :ownerId)
                group by year(b.startDate), month(b.startDate)
                order by year(b.startDate), month(b.startDate)
            """)
    List<Object[]> sumRevenueGroupedByMonth(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("statuses") List<BookingStatus> statuses,
            @Param("ownerId") Integer ownerId);

    // ----- Reports: usage (bookings for owner in date range) -----
    @Query("""
                select b from BookingEntity b
                where b.vehicle.owner.id = :ownerId
                  and b.startDate >= :from and b.startDate < :to
                  and b.status in :statuses
                order by b.vehicle.id, b.startDate
            """)
    List<BookingEntity> findBookingsForUsageReport(
            @Param("ownerId") Integer ownerId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("statuses") List<BookingStatus> statuses);

    // ----- Reports: booking stats (start dates for grouping in service) -----
    @Query("""
                select b.startDate from BookingEntity b
                where b.startDate >= :from and b.startDate < :to
                  and (:ownerId is null or b.vehicle.owner.id = :ownerId)
                  and b.status in :statuses
            """)
    List<LocalDateTime> findStartDatesForStats(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("ownerId") Integer ownerId,
            @Param("statuses") List<BookingStatus> statuses);
}
