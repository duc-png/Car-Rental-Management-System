package com.example.car_management.mapper;

import com.example.car_management.dto.request.RegisterRequest;
import com.example.car_management.dto.response.UserResponse;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.enums.UserRole;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "roleId", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "address", ignore = true)
    @Mapping(target = "isVerified", constant = "false")
    @Mapping(target = "isActive", constant = "true")
    @Mapping(target = "createdAt", ignore = true)
    UserEntity toEntity(RegisterRequest request);

    @Mapping(target = "roleId", expression = "java(mapRoleId(user.getRoleId()))")
    UserResponse toResponse(UserEntity user);

    default String mapRoleId(UserRole role) {
        if (role == null) {
            return null;
        }
        return role.name();
    }
}
