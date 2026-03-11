package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.request.ReturnInspectionRequest;
import com.example.car_management.dto.response.ReturnInspectionResponse;
import com.example.car_management.service.ReturnInspectionService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/returns")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReturnInspectionController {

    ReturnInspectionService returnInspectionService;

    @PostMapping("/{bookingId}/inspection")
    public ResponseEntity<ApiResponse<ReturnInspectionResponse>> submitInspection(
            @PathVariable Integer bookingId,
            @Valid @RequestBody ReturnInspectionRequest request) {
        ReturnInspectionResponse result = returnInspectionService.submitInspection(bookingId, request);
        return ResponseEntity.ok(ApiResponse.<ReturnInspectionResponse>builder()
                .code(1000)
                .message("Inspection submitted successfully")
                .result(result)
                .build());
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<ApiResponse<ReturnInspectionResponse>> getInspection(
            @PathVariable Integer bookingId) {
        ReturnInspectionResponse result = returnInspectionService.getInspection(bookingId);
        return ResponseEntity.ok(ApiResponse.<ReturnInspectionResponse>builder()
                .code(1000)
                .message("Success")
                .result(result)
                .build());
    }

    @PostMapping("/{bookingId}/confirm")
    public ResponseEntity<ApiResponse<ReturnInspectionResponse>> confirmFees(
            @PathVariable Integer bookingId) {
        ReturnInspectionResponse result = returnInspectionService.confirmFees(bookingId);
        return ResponseEntity.ok(ApiResponse.<ReturnInspectionResponse>builder()
                .code(1000)
                .message("Fees confirmed successfully")
                .result(result)
                .build());
    }
}

