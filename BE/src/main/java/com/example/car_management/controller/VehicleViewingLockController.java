package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.response.VehicleViewingLockResponse;
import com.example.car_management.service.VehicleViewingLockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleViewingLockController {

    private final VehicleViewingLockService vehicleViewingLockService;

    @PostMapping("/{vehicleId}/viewing-lock")
    public ResponseEntity<ApiResponse<VehicleViewingLockResponse>> acquireLock(
            @PathVariable Integer vehicleId) {
        VehicleViewingLockResponse response = vehicleViewingLockService.acquireLock(vehicleId);
        return ResponseEntity.ok(ApiResponse.<VehicleViewingLockResponse>builder()
                .result(response)
                .build());
    }

    @DeleteMapping("/{vehicleId}/viewing-lock")
    public ResponseEntity<ApiResponse<VehicleViewingLockResponse>> releaseLock(
            @PathVariable Integer vehicleId) {
        VehicleViewingLockResponse response = vehicleViewingLockService.releaseLock(vehicleId);
        return ResponseEntity.ok(ApiResponse.<VehicleViewingLockResponse>builder()
                .result(response)
                .build());
    }

    @GetMapping("/{vehicleId}/viewing-lock")
    public ResponseEntity<ApiResponse<VehicleViewingLockResponse>> getLockStatus(
            @PathVariable Integer vehicleId) {
        VehicleViewingLockResponse response = vehicleViewingLockService.getLockStatus(vehicleId);
        return ResponseEntity.ok(ApiResponse.<VehicleViewingLockResponse>builder()
                .result(response)
                .build());
    }
}
