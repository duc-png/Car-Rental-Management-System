package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.request.AddMaintenanceCostItemRequest;
import com.example.car_management.dto.request.CreateMaintenanceRecordRequest;
import com.example.car_management.dto.request.UpdateMaintenanceStatusRequest;
import com.example.car_management.dto.response.MaintenanceRecordResponse;
import com.example.car_management.service.MaintenanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @PostMapping
    public ResponseEntity<ApiResponse<MaintenanceRecordResponse>> create(
            @Valid @RequestBody CreateMaintenanceRecordRequest request) {
        MaintenanceRecordResponse result = maintenanceService.createRecord(request);
        return ResponseEntity.ok(ApiResponse.<MaintenanceRecordResponse>builder()
                .result(result)
                .build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<MaintenanceRecordResponse>> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateMaintenanceStatusRequest request) {
        MaintenanceRecordResponse result = maintenanceService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.<MaintenanceRecordResponse>builder()
                .result(result)
                .build());
    }

    @PostMapping("/{id}/costs")
    public ResponseEntity<ApiResponse<MaintenanceRecordResponse>> addCostItem(
            @PathVariable Integer id,
            @Valid @RequestBody AddMaintenanceCostItemRequest request) {
        MaintenanceRecordResponse result = maintenanceService.addCostItem(id, request);
        return ResponseEntity.ok(ApiResponse.<MaintenanceRecordResponse>builder()
                .result(result)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MaintenanceRecordResponse>> getById(@PathVariable Integer id) {
        MaintenanceRecordResponse result = maintenanceService.getById(id);
        return ResponseEntity.ok(ApiResponse.<MaintenanceRecordResponse>builder()
                .result(result)
                .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MaintenanceRecordResponse>>> list(
            @RequestParam(required = false) Integer vehicleId,
            @RequestParam(required = false) Integer customerId) {
        List<MaintenanceRecordResponse> result;
        if (vehicleId != null) {
            result = maintenanceService.listByVehicle(vehicleId);
        } else if (customerId != null) {
            result = maintenanceService.listByCustomer(customerId);
        } else {
            result = List.of();
        }
        return ResponseEntity.ok(ApiResponse.<List<MaintenanceRecordResponse>>builder()
                .result(result)
                .build());
    }
}

