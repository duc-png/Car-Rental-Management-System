package com.example.car_management.service;

import com.example.car_management.dto.request.AddMaintenanceCostItemRequest;
import com.example.car_management.dto.request.CreateMaintenanceRecordRequest;
import com.example.car_management.dto.request.UpdateMaintenanceStatusRequest;
import com.example.car_management.dto.response.MaintenanceRecordResponse;

import java.util.List;

public interface MaintenanceService {

    MaintenanceRecordResponse createRecord(CreateMaintenanceRecordRequest request);

    MaintenanceRecordResponse updateStatus(Integer id, UpdateMaintenanceStatusRequest request);

    MaintenanceRecordResponse addCostItem(Integer id, AddMaintenanceCostItemRequest request);

    MaintenanceRecordResponse getById(Integer id);

    List<MaintenanceRecordResponse> listByVehicle(Integer vehicleId);

    List<MaintenanceRecordResponse> listByCustomer(Integer customerId);
}

