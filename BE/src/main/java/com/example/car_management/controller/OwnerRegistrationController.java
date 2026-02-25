package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.request.AdminOwnerRegistrationDecisionRequest;
import com.example.car_management.dto.request.CreateOwnerRegistrationRequest;
import com.example.car_management.dto.response.OwnerRegistrationRequestResponse;
import com.example.car_management.entity.enums.OwnerRegistrationStatus;
import com.example.car_management.service.OwnerRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/owner-registrations")
public class OwnerRegistrationController {

    private final OwnerRegistrationService ownerRegistrationService;

        @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<OwnerRegistrationRequestResponse>> submit(
                        @Valid @RequestPart("data") CreateOwnerRegistrationRequest request,
                        @RequestPart("images") java.util.List<MultipartFile> images
    ) {
                OwnerRegistrationRequestResponse data = ownerRegistrationService.submit(request, images);
        return ResponseEntity.ok(ApiResponse.<OwnerRegistrationRequestResponse>builder()
                .code(1000)
                .message("Submitted")
                .result(data)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<List<OwnerRegistrationRequestResponse>>> listForAdmin(
            @RequestParam(required = false) OwnerRegistrationStatus status
    ) {
        List<OwnerRegistrationRequestResponse> data = ownerRegistrationService.listForAdmin(status);
        return ResponseEntity.ok(ApiResponse.<List<OwnerRegistrationRequestResponse>>builder()
                .code(1000)
                .message("Success")
                .result(data)
                .build());
    }

    @GetMapping("/{requestId}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<OwnerRegistrationRequestResponse>> detailForAdmin(
            @PathVariable Integer requestId
    ) {
        OwnerRegistrationRequestResponse data = ownerRegistrationService.getDetailForAdmin(requestId);
        return ResponseEntity.ok(ApiResponse.<OwnerRegistrationRequestResponse>builder()
                .code(1000)
                .message("Success")
                .result(data)
                .build());
    }

    @PatchMapping("/{requestId}/approve")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<OwnerRegistrationRequestResponse>> approve(
            @PathVariable Integer requestId,
            @RequestBody(required = false) AdminOwnerRegistrationDecisionRequest request
    ) {
        OwnerRegistrationRequestResponse data = ownerRegistrationService.approve(requestId, request);
        return ResponseEntity.ok(ApiResponse.<OwnerRegistrationRequestResponse>builder()
                .code(1000)
                .message("Approved")
                .result(data)
                .build());
    }

    @PatchMapping("/{requestId}/cancel")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<OwnerRegistrationRequestResponse>> cancel(
            @PathVariable Integer requestId,
            @RequestBody(required = false) AdminOwnerRegistrationDecisionRequest request
    ) {
        OwnerRegistrationRequestResponse data = ownerRegistrationService.cancel(requestId, request);
        return ResponseEntity.ok(ApiResponse.<OwnerRegistrationRequestResponse>builder()
                .code(1000)
                .message("Cancelled")
                .result(data)
                .build());
    }
}
