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
                where b.customer.id = :userId or b.vehicle.owner.id = :userId
                order by b.createdAt desc
            """)
    List<BookingEntity> findByRenterIdOrOwnerId(@Param("userId") Integer userId);

    @Query("""
                select b.customer.id as customerId,
                       count(b.id) as totalBookings,
                       coalesce(sum(b.totalPrice), 0) as totalRevenue
                from BookingEntity b
                where b.customer.id in :customerIds
                group by b.customer.id
            """)
    List<CustomerBookingSummary> summarizeByCustomerIds(@Param("customerIds") Collection<Integer> customerIds);

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
