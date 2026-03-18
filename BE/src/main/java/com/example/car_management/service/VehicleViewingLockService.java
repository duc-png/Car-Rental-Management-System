package com.example.car_management.service;

import com.example.car_management.dto.response.VehicleViewingLockResponse;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.repository.UserRepository;
import com.example.car_management.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleViewingLockService {

    private static final int LOCK_DURATION_MINUTES = 10;

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @Transactional
    public VehicleViewingLockResponse acquireLock(Integer vehicleId) {
        Integer userId = getCurrentUserId();
        if (userId == null) {
            return VehicleViewingLockResponse.builder()
                    .locked(false)
                    .lockedByMe(false)
                    .message("Không áp dụng khóa xem xe cho người chưa đăng nhập")
                    .build();
        }

        VehicleEntity vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

        // Owner cannot lock their own vehicle
        if (vehicle.getOwner() != null && vehicle.getOwner().getId().equals(userId)) {
            return VehicleViewingLockResponse.builder()
                    .locked(false)
                    .lockedByMe(false)
                    .message("Chủ xe không cần khóa xe của mình")
                    .build();
        }

        Instant now = Instant.now();
        Instant expiry = now.plus(LOCK_DURATION_MINUTES, ChronoUnit.MINUTES);

        // If already locked by someone else and not expired
        if (vehicle.getViewingLockExpiresAt() != null
                && vehicle.getViewingLockExpiresAt().isAfter(now)
                && vehicle.getViewingLockedByUserId() != null
                && !vehicle.getViewingLockedByUserId().equals(userId)) {
            return VehicleViewingLockResponse.builder()
                    .locked(true)
                    .lockedByMe(false)
                    .expiresAt(vehicle.getViewingLockExpiresAt())
                    .message("Xe đang được khách khác xem. Vui lòng thử lại sau.")
                    .build();
        }

        // Acquire or renew lock
        vehicle.setViewingLockedByUserId(userId);
        vehicle.setViewingLockExpiresAt(expiry);
        vehicleRepository.save(vehicle);

        log.info("Viewing lock acquired: vehicleId={}, userId={}, expiresAt={}", vehicleId, userId, expiry);

        return VehicleViewingLockResponse.builder()
                .locked(true)
                .lockedByMe(true)
                .expiresAt(expiry)
                .message("Đã khóa xe cho phiên xem của bạn")
                .build();
    }

    @Transactional
    public VehicleViewingLockResponse releaseLock(Integer vehicleId) {
        Integer userId = getCurrentUserId();
        if (userId == null) {
            return VehicleViewingLockResponse.builder()
                    .locked(false)
                    .lockedByMe(false)
                    .build();
        }

        VehicleEntity vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

        Instant now = Instant.now();

        // Only release if current user holds the lock and it hasn't expired
        if (userId.equals(vehicle.getViewingLockedByUserId())
                && vehicle.getViewingLockExpiresAt() != null
                && vehicle.getViewingLockExpiresAt().isAfter(now)) {
            vehicle.setViewingLockedByUserId(null);
            vehicle.setViewingLockExpiresAt(null);
            vehicleRepository.save(vehicle);
            log.info("Viewing lock released: vehicleId={}, userId={}", vehicleId, userId);
        }

        return VehicleViewingLockResponse.builder()
                .locked(false)
                .lockedByMe(false)
                .message("Đã mở khóa xe")
                .build();
    }

    @Transactional(readOnly = true)
    public VehicleViewingLockResponse getLockStatus(Integer vehicleId) {
        Integer userId = getCurrentUserId();

        VehicleEntity vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

        Instant now = Instant.now();

        boolean isLocked = vehicle.getViewingLockExpiresAt() != null
                && vehicle.getViewingLockExpiresAt().isAfter(now)
                && vehicle.getViewingLockedByUserId() != null;

        if (!isLocked) {
            return VehicleViewingLockResponse.builder()
                    .locked(false)
                    .lockedByMe(false)
                    .build();
        }

        boolean lockedByMe = userId != null && userId.equals(vehicle.getViewingLockedByUserId());

        return VehicleViewingLockResponse.builder()
                .locked(true)
                .lockedByMe(lockedByMe)
                .expiresAt(vehicle.getViewingLockExpiresAt())
                .message(lockedByMe ? "Bạn đang xem xe này" : "Có người đang xem xe này rồi")
                .build();
    }

    private Integer getCurrentUserId() {
        try {
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()
                    || "anonymousUser".equals(authentication.getName())) {
                return null;
            }
            String name = authentication.getName();
            Optional<UserEntity> byEmail = userRepository.findByEmail(name);
            if (byEmail.isPresent())
                return byEmail.get().getId();

            if (authentication instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth) {
                String emailClaim = jwtAuth.getToken().getClaimAsString("email");
                if (emailClaim != null) {
                    return userRepository.findByEmail(emailClaim).map(UserEntity::getId).orElse(null);
                }
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}
