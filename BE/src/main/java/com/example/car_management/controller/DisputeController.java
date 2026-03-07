package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.request.CreateDisputeRequest;
import com.example.car_management.dto.request.ResolveDisputeRequest;
import com.example.car_management.dto.response.DisputeResponse;
import com.example.car_management.service.DisputeService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DisputeController {

    DisputeService disputeService;

    @PostMapping
    public ResponseEntity<ApiResponse<DisputeResponse>> createDispute(
            @Valid @RequestBody CreateDisputeRequest request) {
        DisputeResponse result = disputeService.createDispute(request);
        return ResponseEntity.ok(ApiResponse.<DisputeResponse>builder()
                .code(1000)
                .message("Dispute created successfully")
                .result(result)
                .build());
    }

    @GetMapping("/{disputeId}")
    public ResponseEntity<ApiResponse<DisputeResponse>> getDispute(
            @PathVariable Integer disputeId) {
        DisputeResponse result = disputeService.getDispute(disputeId);
        return ResponseEntity.ok(ApiResponse.<DisputeResponse>builder()
                .code(1000)
                .message("Success")
                .result(result)
                .build());
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<DisputeResponse>> getDisputeByBooking(
            @PathVariable Integer bookingId) {
        DisputeResponse result = disputeService.getDisputeByBookingId(bookingId);
        return ResponseEntity.ok(ApiResponse.<DisputeResponse>builder()
                .code(1000)
                .message("Success")
                .result(result)
                .build());
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<DisputeResponse>>> getMyDisputes() {
        List<DisputeResponse> result = disputeService.getMyDisputes();
        return ResponseEntity.ok(ApiResponse.<List<DisputeResponse>>builder()
                .code(1000)
                .message("Success")
                .result(result)
                .build());
    }

    @PostMapping("/{disputeId}/start-discussion")
    public ResponseEntity<ApiResponse<DisputeResponse>> startDiscussion(
            @PathVariable Integer disputeId) {
        DisputeResponse result = disputeService.startDiscussion(disputeId);
        return ResponseEntity.ok(ApiResponse.<DisputeResponse>builder()
                .code(1000)
                .message("Discussion started")
                .result(result)
                .build());
    }

    @PostMapping("/{disputeId}/resolve")
    public ResponseEntity<ApiResponse<DisputeResponse>> resolveDispute(
            @PathVariable Integer disputeId,
            @Valid @RequestBody ResolveDisputeRequest request) {
        DisputeResponse result = disputeService.resolveDispute(disputeId, request);
        return ResponseEntity.ok(ApiResponse.<DisputeResponse>builder()
                .code(1000)
                .message("Dispute resolved successfully")
                .result(result)
                .build());
    }

    @PostMapping("/{disputeId}/accept")
    public ResponseEntity<ApiResponse<DisputeResponse>> acceptResolution(
            @PathVariable Integer disputeId) {
        DisputeResponse result = disputeService.acceptResolution(disputeId);
        return ResponseEntity.ok(ApiResponse.<DisputeResponse>builder()
                .code(1000)
                .message("Resolution accepted")
                .result(result)
                .build());
    }
}
