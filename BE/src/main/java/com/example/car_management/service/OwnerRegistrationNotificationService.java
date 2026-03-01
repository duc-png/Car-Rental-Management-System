package com.example.car_management.service;

import com.example.car_management.entity.OwnerRegistration;

public interface OwnerRegistrationNotificationService {
    void sendApprovedEmail(OwnerRegistration registration);

    void sendRejectedEmail(OwnerRegistration registration);
}
