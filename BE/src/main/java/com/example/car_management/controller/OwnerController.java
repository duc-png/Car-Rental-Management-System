package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.response.OwnerProfileResponse;
import com.example.car_management.dto.response.OwnerPublicProfileResponse;
import com.example.car_management.service.OwnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/owners")
public class OwnerController {

    private final OwnerService ownerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OwnerProfileResponse>>> list(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String q
    ) {
        List<OwnerProfileResponse> data = ownerService.listOwners(page, size, q);
        return ResponseEntity.ok(ApiResponse.<List<OwnerProfileResponse>>builder()
                .code(1000).message("Success").result(data).build());
    }

    @GetMapping("/{ownerId}")
    public ResponseEntity<ApiResponse<OwnerProfileResponse>> detail(@PathVariable Integer ownerId) {
        OwnerProfileResponse data = ownerService.getOwnerProfile(ownerId);
        return ResponseEntity.ok(ApiResponse.<OwnerProfileResponse>builder()
                .code(1000).message("Success").result(data).build());
    }

    @GetMapping("/{ownerId}/public-profile")
    public ResponseEntity<ApiResponse<OwnerPublicProfileResponse>> publicProfile(@PathVariable Integer ownerId) {
        OwnerPublicProfileResponse data = ownerService.getOwnerPublicProfile(ownerId);
        return ResponseEntity.ok(ApiResponse.<OwnerPublicProfileResponse>builder()
                .code(1000).message("Success").result(data).build());
    }
}
