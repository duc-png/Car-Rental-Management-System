package com.example.car_management.repository;

import com.example.car_management.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

<<<<<<< HEAD
public interface UserRepository extends JpaRepository<UserEntity, Integer> {
=======
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Integer> {
    Optional<UserEntity> findByEmail(String email);
>>>>>>> ducmito
}
