package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.request.AdminOwnerRegistrationDecisionRequest;
import com.example.car_management.dto.request.CreateOwnerRegistrationRequest;
import com.example.car_management.dto.request.VerifyOwnerEmailOtpRequest;
import com.example.car_management.dto.response.OwnerRegistrationRequestResponse;
import com.example.car_management.entity.enums.OwnerRegistrationStatus;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.service.OwnerRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/owner-registrations")
public class OwnerRegistrationController {

        private final OwnerRegistrationService ownerRegistrationService;

        // Flow submit ho so chu xe:
        // 1) Nhan payload multipart (data + images).
        // 2) Chuyen xu ly sang service de validate trung email/bien so + luu ho so
        // PENDING.
        // 3) Tra response ho so vua tao cho FE.
        @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<ApiResponse<OwnerRegistrationRequestResponse>> submit(
                        @Valid @RequestPart("data") CreateOwnerRegistrationRequest request,
                        @RequestPart("images") java.util.List<MultipartFile> images) {
                OwnerRegistrationRequestResponse data = ownerRegistrationService.submit(request, images);
                return ResponseEntity.ok(ApiResponse.<OwnerRegistrationRequestResponse>builder()
                                .code(1000)
                                .message("Submitted")
                                .result(data)
                                .build());
        }

        // API admin lay danh sach ho so dang ky chu xe theo trang thai
        // (pending/approved/cancelled).
        @GetMapping
        @PreAuthorize("hasAuthority('ROLE_ADMIN')")
        public ResponseEntity<ApiResponse<List<OwnerRegistrationRequestResponse>>> listForAdmin(
                        @RequestParam(required = false) OwnerRegistrationStatus status) {
                List<OwnerRegistrationRequestResponse> data = ownerRegistrationService.listForAdmin(status);
                return ResponseEntity.ok(ApiResponse.<List<OwnerRegistrationRequestResponse>>builder()
                                .code(1000)
                                .message("Success")
                                .result(data)
                                .build());
        }

        // API admin xem chi tiet mot ho so dang ky chu xe.
        @GetMapping("/{requestId}")
        @PreAuthorize("hasAuthority('ROLE_ADMIN')")
        public ResponseEntity<ApiResponse<OwnerRegistrationRequestResponse>> detailForAdmin(
                        @PathVariable Integer requestId) {
                OwnerRegistrationRequestResponse data = ownerRegistrationService.getDetailForAdmin(requestId);
                return ResponseEntity.ok(ApiResponse.<OwnerRegistrationRequestResponse>builder()
                                .code(1000)
                                .message("Success")
                                .result(data)
                                .build());
        }

        // Flow duyet ho so chu xe:
        // 1) Kiem tra ho so dang o trang thai PENDING.
        // 2) Tao tai khoan role CAR_OWNER + tao xe tu du lieu dang ky.
        // 3) Cap nhat ho so sang APPROVED va gui thong bao cho owner.
        @PatchMapping("/{requestId}/approve")
        @PreAuthorize("hasAuthority('ROLE_ADMIN')")
        public ResponseEntity<ApiResponse<OwnerRegistrationRequestResponse>> approve(
                        @PathVariable Integer requestId,
                        @RequestBody(required = false) AdminOwnerRegistrationDecisionRequest request) {
                OwnerRegistrationRequestResponse data = ownerRegistrationService.approve(requestId, request);
                return ResponseEntity.ok(ApiResponse.<OwnerRegistrationRequestResponse>builder()
                                .code(1000)
                                .message("Approved")
                                .result(data)
                                .build());
        }

        // Flow tu choi ho so chu xe: chi cho phep huy khi PENDING, luu note admin va
        // cap nhat trang thai CANCELLED.
        @PatchMapping("/{requestId}/cancel")
        @PreAuthorize("hasAuthority('ROLE_ADMIN')")
        public ResponseEntity<ApiResponse<OwnerRegistrationRequestResponse>> cancel(
                        @PathVariable Integer requestId,
                        @RequestBody(required = false) AdminOwnerRegistrationDecisionRequest request) {
                OwnerRegistrationRequestResponse data = ownerRegistrationService.cancel(requestId, request);
                return ResponseEntity.ok(ApiResponse.<OwnerRegistrationRequestResponse>builder()
                                .code(1000)
                                .message("Cancelled")
                                .result(data)
                                .build());
        }

        @PostMapping("/email-otp/send")
        public ResponseEntity<ApiResponse<Object>> sendOwnerEmailOtp(@AuthenticationPrincipal Jwt jwt) {
                ownerRegistrationService.sendOwnerEmailVerificationOtp(resolveUserId(jwt));
                return ResponseEntity.ok(ApiResponse.builder()
                                .code(1000)
                                .message("OTP sent")
                                .build());
        }

        @PostMapping("/email-otp/verify")
        public ResponseEntity<ApiResponse<Object>> verifyOwnerEmailOtp(
                        @AuthenticationPrincipal Jwt jwt,
                        @Valid @RequestBody VerifyOwnerEmailOtpRequest request) {
                ownerRegistrationService.verifyOwnerEmailVerificationOtp(resolveUserId(jwt), request.getOtp());
                return ResponseEntity.ok(ApiResponse.builder()
                                .code(1000)
                                .message("Email verified")
                                .build());
        }

        private Integer resolveUserId(Jwt jwt) {
                if (jwt == null) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                Object claim = jwt.getClaim("userId");

                if (claim instanceof Number number) {
                        return number.intValue();
                }

                if (claim instanceof String value) {
                        try {
                                return Integer.parseInt(value);
                        } catch (NumberFormatException ignored) {
                                throw new AppException(ErrorCode.UNAUTHORIZED);
                        }
                }

                throw new AppException(ErrorCode.UNAUTHORIZED);
        }
}
