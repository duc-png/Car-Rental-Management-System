package com.example.car_management.service;

import com.example.car_management.dto.response.NotificationResponse;
import com.example.car_management.entity.OwnerRegistration;
import com.example.car_management.entity.VehicleEntity;

import java.util.List;

public interface NotificationService {
    List<NotificationResponse> getMyNotifications(Boolean unreadOnly, Integer limit);

    long getMyUnreadCount();

    void markAsRead(Integer notificationId);

    void markAllAsRead();

    void notifyAdminsOwnerRegistrationSubmitted(OwnerRegistration registration);

    void notifyAdminsVehicleSubmitted(VehicleEntity vehicle);

    void notifyOwnerVehicleApproved(VehicleEntity vehicle);

    void notifyOwnerVehicleRejected(VehicleEntity vehicle, String reason);
}
