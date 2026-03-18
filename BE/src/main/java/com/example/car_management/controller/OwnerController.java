package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.request.UpdateCustomerStatusRequest;
import com.example.car_management.dto.response.OwnerPerformanceResponse;
import com.example.car_management.dto.response.OwnerProfileResponse;
import com.example.car_management.dto.response.OwnerPublicProfileResponse;
import com.example.car_management.service.OwnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/owners")
public class OwnerController {

    private final OwnerService ownerService;

    // Flow danh sach chu xe: controller nhan filter -> service truy van + map du
    // lieu ->
    // tra ve cho man hinh quan tri.
    @GetMapping
    public ResponseEntity<ApiResponse<List<OwnerProfileResponse>>> list(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String q) {
        List<OwnerProfileResponse> data = ownerService.listOwners(page, size, q);
        return ResponseEntity.ok(ApiResponse.<List<OwnerProfileResponse>>builder()
                .code(1000).message("Success").result(data).build());
    }

    // Flow chi tiet chu xe: lay owner theo id, gom thong tin ho so va tra ve 1
    // object.
    @GetMapping("/{ownerId}")
    public ResponseEntity<ApiResponse<OwnerProfileResponse>> detail(@PathVariable Integer ownerId) {
        OwnerProfileResponse data = ownerService.getOwnerProfile(ownerId);
        return ResponseEntity.ok(ApiResponse.<OwnerProfileResponse>builder()
                .code(1000).message("Success").result(data).build());
    }

    @GetMapping("/{ownerId}/performance")
    public ResponseEntity<ApiResponse<OwnerPerformanceResponse>> performance(@PathVariable Integer ownerId) {
        OwnerPerformanceResponse data = ownerService.getOwnerPerformance(ownerId);
        return ResponseEntity.ok(ApiResponse.<OwnerPerformanceResponse>builder()
                .code(1000).message("Success").result(data).build());
    }

    // Flow public profile: tra ve thong tin da rut gon, an cac truong noi bo cua
    // owner.
    @GetMapping("/{ownerId}/public-profile")
    public ResponseEntity<ApiResponse<OwnerPublicProfileResponse>> publicProfile(@PathVariable Integer ownerId) {
        OwnerPublicProfileResponse data = ownerService.getOwnerPublicProfile(ownerId);
        return ResponseEntity.ok(ApiResponse.<OwnerPublicProfileResponse>builder()
                .code(1000).message("Success").result(data).build());
    }

    @PatchMapping("/{ownerId}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ADMIN')")
    public ResponseEntity<ApiResponse<OwnerProfileResponse>> updateOwnerStatus(
            @PathVariable Integer ownerId,
            @RequestBody UpdateCustomerStatusRequest request) {
        OwnerProfileResponse data = ownerService.updateOwnerStatus(ownerId, request);
        return ResponseEntity.ok(ApiResponse.<OwnerProfileResponse>builder()
                .code(1000).message("Success").result(data).build());
    }
}
