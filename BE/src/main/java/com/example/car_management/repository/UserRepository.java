package com.example.car_management.repository;

import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {
    Optional<UserEntity> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
            select u from UserEntity u
            where (:q is null or :q = '' or
                   lower(u.fullName) like lower(concat('%', :q, '%')) or
                   lower(u.email) like lower(concat('%', :q, '%')) or
                   lower(u.phone) like lower(concat('%', :q, '%')))
              and (u.roleId is null or u.roleId = :role)
            order by u.createdAt desc
            """)
    List<UserEntity> searchCustomers(@Param("q") String q, @Param("role") UserRole role);
}
