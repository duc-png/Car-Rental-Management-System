package com.example.car_management.repository;

import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {
    Optional<UserEntity> findByEmail(String email);
    UserEntity findById(Long id);
    boolean existsByEmail(String email);

  List<UserEntity> findByRoleId(UserRole roleId);

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

  @Query("""
      select u from UserEntity u
      where u.roleId = :role
      order by u.id desc
      """)
  Page<UserEntity> findByRole(@Param("role") UserRole role, Pageable pageable);

  @Query("""
        select u from UserEntity u
        where u.roleId = :role
          and (
      :q is null or :q = '' or
      lower(u.fullName) like lower(concat('%', :q, '%')) or
      lower(u.email) like lower(concat('%', :q, '%')) or
      lower(u.phone) like lower(concat('%', :q, '%'))
          )
        order by u.id desc
        """)
  Page<UserEntity> searchByRole(@Param("role") UserRole role, @Param("q") String q, Pageable pageable);
}
