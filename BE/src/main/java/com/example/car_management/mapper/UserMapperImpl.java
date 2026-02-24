package com.example.car_management.mapper;

import com.example.car_management.dto.request.RegisterRequest;
import com.example.car_management.dto.response.UserResponse;
import com.example.car_management.entity.RoleEntity;
import com.example.car_management.entity.UserEntity;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public UserEntity toEntity(RegisterRequest request) {
        if (request == null) {
            return null;
        }

        UserEntity user = new UserEntity();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setLicenseNumber(request.getLicenseNumber());
        user.setIsVerified(false);
        user.setCreatedAt(Instant.now());
        user.setRoles(new HashSet<>());

        return user;
    }

    @Override
    public UserResponse toResponse(UserEntity user) {
        if (user == null) {
            return null;
        }

        return UserResponse.builder()
                .id(user.getId().longValue())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .licenseNumber(user.getLicenseNumber())
                .isVerified(user.getIsVerified())
                .createdAt(user.getCreatedAt())
                .roles(extractRoleNames(user.getRoles()))
                .build();
    }

    @Override
    public Set<String> extractRoleNames(Set<RoleEntity> roles) {
        if (roles == null || roles.isEmpty()) {
            return Set.of();
        }
        return roles.stream()
                .map(RoleEntity::getName)
                .collect(Collectors.toSet());
    }
}
