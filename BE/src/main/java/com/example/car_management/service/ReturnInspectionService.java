package com.example.car_management.service;

import com.example.car_management.dto.request.ReturnInspectionRequest;
import com.example.car_management.dto.response.ReturnInspectionResponse;

public interface ReturnInspectionService {

    ReturnInspectionResponse submitInspection(Integer bookingId, ReturnInspectionRequest request);

    ReturnInspectionResponse getInspection(Integer bookingId);

    ReturnInspectionResponse confirmFees(Integer bookingId);
}

