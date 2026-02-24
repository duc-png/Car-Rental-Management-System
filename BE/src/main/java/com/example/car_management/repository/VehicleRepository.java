package com.example.car_management.repository;

import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.entity.enums.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface VehicleRepository extends JpaRepository<VehicleEntity, Integer> {
    boolean existsByLicensePlate(String licensePlate);
    boolean existsByLicensePlateAndIdNot(String licensePlate, Integer id);
    List<VehicleEntity> findByOwner_Id(Integer ownerId);
    @Query("""
        select distinct v.owner.id
        from VehicleEntity v
        where v.owner is not null
    """)
    List<Integer> findDistinctOwnerIds();

    @Query("""
        select count(v.id)
        from VehicleEntity v
        where v.owner.id = :ownerId
    """)
    long countVehiclesByOwner(@Param("ownerId") Integer ownerId);
    @Query("""
    select v from VehicleEntity v
    where v.status = :status
      and v.location is not null
      and (
          :address is null or :address = '' or
          lower(v.location.city) like lower(concat('%', :address, '%')) or
          lower(v.location.district) like lower(concat('%', :address, '%')) or
          lower(v.location.addressDetail) like lower(concat('%', :address, '%')) or
          lower(concat(
              coalesce(v.location.addressDetail, ''), ', ',
              coalesce(v.location.district, ''), ', ',
              coalesce(v.location.city, '')
          )) like lower(concat('%', :address, '%'))
      )
      and v.id not in (
          select b.vehicle.id from BookingEntity b
          where b.status in :activeStatuses
            and (b.startDate < :to and b.endDate > :from)
      )
    order by v.id desc
""")
    List<VehicleEntity> searchAvailableVehiclesSimple(
            @Param("status") VehicleStatus status,
            @Param("address") String address,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("activeStatuses") List<BookingStatus> activeStatuses
    );
}
