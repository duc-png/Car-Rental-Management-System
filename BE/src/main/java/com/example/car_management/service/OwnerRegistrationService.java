package com.example.car_management.service;

import com.example.car_management.dto.request.AdminOwnerRegistrationDecisionRequest;
import com.example.car_management.dto.request.CreateOwnerRegistrationRequest;
import com.example.car_management.dto.response.OwnerRegistrationRequestResponse;
import com.example.car_management.entity.enums.OwnerRegistrationStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface OwnerRegistrationService {
    OwnerRegistrationRequestResponse submit(CreateOwnerRegistrationRequest request, List<MultipartFile> images);

    List<OwnerRegistrationRequestResponse> listForAdmin(OwnerRegistrationStatus status);

    OwnerRegistrationRequestResponse getDetailForAdmin(Integer requestId);

    OwnerRegistrationRequestResponse approve(Integer requestId, AdminOwnerRegistrationDecisionRequest request);

    OwnerRegistrationRequestResponse cancel(Integer requestId, AdminOwnerRegistrationDecisionRequest request);
}
