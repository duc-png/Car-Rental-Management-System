package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.request.ApplyVoucherRequest;
import com.example.car_management.dto.request.CreateVoucherRequest;
import com.example.car_management.dto.response.VoucherResponse;
import com.example.car_management.service.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping("/generate-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode() {
        String code = voucherService.generateUniqueCode();
        return ResponseEntity.ok(ApiResponse.<Map<String, String>>builder()
                .result(Map.of("code", code))
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VoucherResponse>> createVoucher(
            @Valid @RequestBody CreateVoucherRequest request) {

        VoucherResponse response = voucherService.createVoucher(request);

        return ResponseEntity.ok(ApiResponse.<VoucherResponse>builder()
                .result(response)
                .build());
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<VoucherResponse>> validateVoucher(
            @Valid @RequestBody ApplyVoucherRequest request) {

        VoucherResponse response = voucherService.validateVoucher(request.getCode());

        return ResponseEntity.ok(ApiResponse.<VoucherResponse>builder()
                .result(response)
                .build());
    }
}

