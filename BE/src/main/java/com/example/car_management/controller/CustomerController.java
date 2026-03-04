package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.request.CreateCustomerRequest;
import com.example.car_management.dto.request.UpdateCustomerRequest;
import com.example.car_management.dto.request.UpdateCustomerStatusRequest;
import com.example.car_management.dto.response.CustomerResponse;
import com.example.car_management.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/customers")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> listCustomers(
            @RequestParam(required = false) String q) {
        List<CustomerResponse> data = customerService.listCustomers(q);
        return ResponseEntity.ok(ApiResponse.<List<CustomerResponse>>builder()
                .code(1000)
                .message("Success")
                .result(data)
                .build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(
            @Valid @RequestBody CreateCustomerRequest request) {
        CustomerResponse data = customerService.createCustomer(request);
        return ResponseEntity.ok(ApiResponse.<CustomerResponse>builder()
                .code(1000)
                .message("Success")
                .result(data)
                .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateCustomerRequest request) {
        CustomerResponse data = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(ApiResponse.<CustomerResponse>builder()
                .code(1000)
                .message("Success")
                .result(data)
                .build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomerStatus(
            @PathVariable Integer id,
            @RequestBody UpdateCustomerStatusRequest request) {
        CustomerResponse data = customerService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.<CustomerResponse>builder()
                .code(1000)
                .message("Success")
                .result(data)
                .build());
    }
}
