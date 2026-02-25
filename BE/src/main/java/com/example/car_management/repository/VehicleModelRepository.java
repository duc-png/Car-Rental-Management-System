package com.example.car_management.repository;

import com.example.car_management.entity.VehicleModelEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface VehicleModelRepository extends JpaRepository<VehicleModelEntity, Integer> {

	@Query("select vm from VehicleModelEntity vm join fetch vm.brand join fetch vm.type")
	List<VehicleModelEntity> findAllWithBrandAndType();

	Optional<VehicleModelEntity> findByNameIgnoreCaseAndBrand_NameIgnoreCase(String name, String brandName);
}
