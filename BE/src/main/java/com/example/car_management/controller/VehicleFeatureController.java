package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.response.VehicleFeatureResponse;
import com.example.car_management.repository.VehicleFeatureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/vehicle-features")
public class VehicleFeatureController {

    private final VehicleFeatureRepository vehicleFeatureRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VehicleFeatureResponse>>> list() {
        List<VehicleFeatureResponse> data = vehicleFeatureRepository.findAllByOrderByNameAsc().stream()
                .map(item -> VehicleFeatureResponse.builder()
                        .id(item.getId())
                        .name(item.getName())
                        .build())
                .toList();

        return ResponseEntity.ok(ApiResponse.<List<VehicleFeatureResponse>>builder()
                .code(1000)
                .message("Success")
                .result(data)
                .build());
    }
}
