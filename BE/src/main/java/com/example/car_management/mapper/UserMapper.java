package com.example.car_management.mapper;

import com.example.car_management.dto.request.RegisterRequest;
import com.example.car_management.dto.response.UserResponse;
import com.example.car_management.entity.UserEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "id", ignore = true)          // JPA tự generate
    @Mapping(target = "password", ignore = true)    // hash ở service
    @Mapping(target = "createdAt", ignore = true)   // set ở service
    @Mapping(target = "isVerified", ignore = true)  // set ở service
    @Mapping(target = "roleId", ignore = true)      // set ở service (USER/ADMIN/...)
    UserEntity toEntity(RegisterRequest request);

    UserResponse toResponse(UserEntity user);
}
