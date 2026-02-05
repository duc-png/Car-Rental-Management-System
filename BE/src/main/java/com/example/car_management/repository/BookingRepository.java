package com.example.car_management.repository;

import com.example.car_management.entity.BookingEntity;
import com.example.car_management.entity.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
