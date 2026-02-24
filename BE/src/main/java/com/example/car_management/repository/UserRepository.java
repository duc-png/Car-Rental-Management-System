package com.example.car_management.repository;

import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {
    Optional<UserEntity> findByEmail(String email);
    @Query("""
        select u from UserEntity u
        where u.roleId = :role
    """)
    Page<UserEntity> findByRole(@Param("role") UserRole role, Pageable pageable);

    @Query("""
        select u from UserEntity u
        where u.roleId = :role
          and (
               lower(u.fullName) like lower(concat('%', :q, '%'))
            or lower(u.email) like lower(concat('%', :q, '%'))
            or lower(u.phone) like lower(concat('%', :q, '%'))
          )
    """)
    Page<UserEntity> searchByRole(@Param("role") UserRole role,
                                  @Param("q") String q,
                                  Pageable pageable);
    @Query("select u from UserEntity u where u.id in :ids")
    List<UserEntity> findByIds(@Param("ids") List<Integer> ids);
}
