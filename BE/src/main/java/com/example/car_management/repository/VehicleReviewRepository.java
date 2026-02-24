package com.example.car_management.repository;

import com.example.car_management.entity.VehicleReviewEntity;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VehicleReviewRepository extends JpaRepository<VehicleReviewEntity, Integer> {

    @Query("""
        select coalesce(avg(r.vehicleRating), 0), count(r.id)
        from VehicleReviewEntity r
        where r.booking.vehicle.owner.id = :ownerId
    """)
    Object[] getOwnerRatingStats(@Param("ownerId") Integer ownerId);

    @Query("""
        select coalesce(avg(r.vehicleRating), 0), count(r.id)
        from VehicleReviewEntity r
        where r.booking.vehicle.id = :vehicleId
    """)
    Object[] getVehicleRatingStats(@Param("vehicleId") Integer vehicleId);

    @Query("""
        select r
        from VehicleReviewEntity r
        where r.booking.vehicle.owner.id = :ownerId
        order by r.createdAt desc, r.id desc
    """)
    List<VehicleReviewEntity> findReceivedReviewsByOwner(@Param("ownerId") Integer ownerId);

    boolean existsByBooking_Id(Integer bookingId);
}
