package com.example.car_management.mapper;

import com.example.car_management.dto.request.RegisterRequest;
import com.example.car_management.dto.response.UserResponse;
import com.example.car_management.entity.RoleEntity;
import com.example.car_management.entity.UserEntity;

import java.util.Set;

public interface UserMapper {

    UserEntity toEntity(RegisterRequest request);

    UserResponse toResponse(UserEntity user);

    Set<String> extractRoleNames(Set<RoleEntity> roles);
}
