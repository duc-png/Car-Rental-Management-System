package com.example.car_management.service.impl;

import com.example.car_management.dto.response.NotificationResponse;
import com.example.car_management.entity.NotificationEntity;
import com.example.car_management.entity.OwnerRegistration;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.repository.NotificationRepository;
import com.example.car_management.repository.UserRepository;
import com.example.car_management.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(Boolean unreadOnly, Integer limit) {
        Integer userId = getCurrentUserId();

        List<NotificationEntity> list = Boolean.TRUE.equals(unreadOnly)
                ? notificationRepository.findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(userId)
                : notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId);

        int safeLimit = (limit == null || limit <= 0) ? 50 : Math.min(limit, 200);

        return list.stream()
                .limit(safeLimit)
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getMyUnreadCount() {
        return notificationRepository.countByUser_IdAndIsReadFalse(getCurrentUserId());
    }

    @Override
    @Transactional
    public void markAsRead(Integer notificationId) {
        NotificationEntity notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));

        Integer userId = getCurrentUserId();
        Integer ownerId = notification.getUser() == null ? null : notification.getUser().getId();
        if (ownerId == null || !ownerId.equals(userId)) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(Boolean.TRUE);
            notificationRepository.save(notification);
        }
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        Integer userId = getCurrentUserId();
        List<NotificationEntity> list = notificationRepository.findByUser_IdAndIsReadFalseOrderByCreatedAtDesc(userId);
        if (list.isEmpty()) {
            return;
        }

        for (NotificationEntity notification : list) {
            notification.setIsRead(Boolean.TRUE);
        }
        notificationRepository.saveAll(list);
    }

    @Override
    @Transactional
    public void notifyAdminsOwnerRegistrationSubmitted(OwnerRegistration registration) {
        if (registration == null || registration.getId() == null) {
            return;
        }

        String vehicle = ((registration.getBrandName() == null ? "" : registration.getBrandName() + " ")
                + (registration.getModelName() == null ? "" : registration.getModelName())).trim();
        if (vehicle.isBlank()) {
            vehicle = "Xe mới";
        }

        createForAdmins(
                "Yêu cầu duyệt chủ xe mới",
                "Có yêu cầu đăng ký chủ xe mới từ " + safe(registration.getFullName())
                        + " cho xe " + vehicle + " (" + safe(registration.getLicensePlate()) + ").",
                "HIGH",
                "/admin/owner-registrations/" + registration.getId());
    }

    @Override
    @Transactional
    public void notifyAdminsVehicleSubmitted(VehicleEntity vehicle) {
        if (vehicle == null || vehicle.getId() == null) {
            return;
        }

        String vehicleName = buildVehicleName(vehicle);

        createForAdmins(
                "Yêu cầu duyệt xe mới",
                "Có xe mới chờ duyệt: " + vehicleName + " (" + safe(vehicle.getLicensePlate()) + ").",
                "HIGH",
                "/admin/vehicles/" + vehicle.getId());
    }

    @Override
    @Transactional
    public void notifyOwnerVehicleApproved(VehicleEntity vehicle) {
        if (vehicle == null || vehicle.getId() == null || vehicle.getOwner() == null) {
            return;
        }

        createForUser(
                vehicle.getOwner(),
                "Xe đã được duyệt",
                "Xe " + buildVehicleName(vehicle) + " (" + safe(vehicle.getLicensePlate()) + ") đã được admin duyệt.",
                "SYSTEM",
                "NORMAL",
                "/owner/vehicles/" + vehicle.getId());
    }

    @Override
    @Transactional
    public void notifyOwnerVehicleRejected(VehicleEntity vehicle, String reason) {
        if (vehicle == null || vehicle.getId() == null || vehicle.getOwner() == null) {
            return;
        }

        String note = (reason == null || reason.isBlank()) ? "Chưa có lý do chi tiết." : reason.trim();

        createForUser(
                vehicle.getOwner(),
                "Xe bị từ chối duyệt",
                "Xe " + buildVehicleName(vehicle) + " (" + safe(vehicle.getLicensePlate())
                        + ") đã bị từ chối. Ghi chú: " + note,
                "SYSTEM",
                "HIGH",
                "/owner/vehicles/" + vehicle.getId());
    }

    private void createForAdmins(String title, String message, String priority, String deepLink) {
        List<UserEntity> admins = userRepository.findByRole("ADMIN", Pageable.unpaged()).getContent();
        for (UserEntity admin : admins) {
            createForUser(admin, title, message, "SYSTEM", priority, deepLink);
        }
    }

    private void createForUser(UserEntity user, String title, String message, String type, String priority,
            String deepLink) {
        if (user == null || user.getId() == null) {
            return;
        }

        NotificationEntity notification = NotificationEntity.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .priority(priority)
                .isRead(Boolean.FALSE)
                .deepLink(deepLink)
                .build();

        notificationRepository.save(notification);
    }

    private NotificationResponse toResponse(NotificationEntity n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userId(n.getUser() != null ? n.getUser().getId() : null)
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .priority(n.getPriority())
                .isRead(n.getIsRead())
                .deepLink(n.getDeepLink())
                .createdAt(n.getCreatedAt())
                .build();
    }

    private Integer getCurrentUserId() {
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication();
        String email = authentication.getName();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return user.getId();
    }

    private String safe(String value) {
        if (value == null || value.isBlank()) {
            return "N/A";
        }
        return value.trim();
    }

    private String buildVehicleName(VehicleEntity vehicle) {
        String brand = vehicle.getModel() != null && vehicle.getModel().getBrand() != null
                ? safe(vehicle.getModel().getBrand().getName())
                : "";
        String model = vehicle.getModel() != null ? safe(vehicle.getModel().getName()) : "";

        String combined = (brand + " " + model).trim();
        return combined.isBlank() ? "Xe" : combined;
    }
}
