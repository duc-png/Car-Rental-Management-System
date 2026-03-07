package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.request.ChangePasswordRequest;
import com.example.car_management.dto.request.CreateCustomerRequest;
import com.example.car_management.dto.request.SendEmailOtpRequest;
import com.example.car_management.dto.request.UpdateMyBasicInfoRequest;
import com.example.car_management.dto.request.UpdateMyLicenseInfoRequest;
import com.example.car_management.dto.request.UpdateMyPhoneRequest;
import com.example.car_management.dto.request.UpdateCustomerLicenseVerificationRequest;
import com.example.car_management.dto.request.UpdateCustomerRequest;
import com.example.car_management.dto.request.UpdateCustomerStatusRequest;
import com.example.car_management.dto.request.VerifyEmailOtpRequest;
import com.example.car_management.dto.response.CustomerResponse;
import com.example.car_management.dto.response.LicenseOcrResponse;
import com.example.car_management.dto.response.VehicleResponse;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.service.CustomerService;
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
@RequestMapping("/api/v1/customers")
public class CustomerController {

        private final CustomerService customerService;

        @GetMapping
        @PreAuthorize("hasAuthority('ROLE_ADMIN')")
        public ResponseEntity<ApiResponse<List<CustomerResponse>>> listCustomers(
                        @RequestParam(required = false) String q) {
                List<CustomerResponse> data = customerService.listCustomers(q);
                return ResponseEntity.ok(ApiResponse.<List<CustomerResponse>>builder()
                                .code(1000)
                                .message("Success")
                                .result(data)
                                .build());
        }

        @GetMapping("/profile")
        public ResponseEntity<ApiResponse<CustomerResponse>> getMyProfile(@AuthenticationPrincipal Jwt jwt) {
                CustomerResponse data = customerService.getMyProfile(resolveUserId(jwt));
                return ResponseEntity.ok(ApiResponse.<CustomerResponse>builder()
                                .code(1000)
                                .message("Success")
                                .result(data)
                                .build());
        }

        @PostMapping
        @PreAuthorize("hasAuthority('ROLE_ADMIN')")
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
        @PreAuthorize("hasAuthority('ROLE_ADMIN')")
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

        @PutMapping("/profile")
        public ResponseEntity<ApiResponse<CustomerResponse>> updateMyProfile(
                        @AuthenticationPrincipal Jwt jwt,
                        @Valid @RequestBody UpdateCustomerRequest request) {
                CustomerResponse data = customerService.updateMyProfile(resolveUserId(jwt), request);
                return ResponseEntity.ok(ApiResponse.<CustomerResponse>builder()
                                .code(1000)
                                .message("Success")
                                .result(data)
                                .build());
        }

        @PatchMapping("/profile/basic-info")
        public ResponseEntity<ApiResponse<CustomerResponse>> updateMyBasicInfo(
                        @AuthenticationPrincipal Jwt jwt,
                        @Valid @RequestBody UpdateMyBasicInfoRequest request) {
                CustomerResponse data = customerService.updateMyBasicInfo(resolveUserId(jwt), request);
                return ResponseEntity.ok(ApiResponse.<CustomerResponse>builder()
                                .code(1000)
                                .message("Basic info updated")
                                .result(data)
                                .build());
        }

        @PatchMapping("/profile/license-info")
        // Flow cap nhat GPLX: service sanitize du lieu, check trung so GPLX va reset
        // trang thai xac minh ve PENDING de admin review lai.
        public ResponseEntity<ApiResponse<CustomerResponse>> updateMyLicenseInfo(
                        @AuthenticationPrincipal Jwt jwt,
                        @Valid @RequestBody UpdateMyLicenseInfoRequest request) {
                CustomerResponse data = customerService.updateMyLicenseInfo(resolveUserId(jwt), request);
                return ResponseEntity.ok(ApiResponse.<CustomerResponse>builder()
                                .code(1000)
                                .message("License info updated")
                                .result(data)
                                .build());
        }

        @PostMapping(value = "/profile/license-ocr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        // Flow OCR GPLX: service goi FPT Vision, trich xuat truong du lieu va upload
        // anh GPLX len cloud de tra ve URL.
        public ResponseEntity<ApiResponse<LicenseOcrResponse>> scanMyLicenseWithOcr(
                        @AuthenticationPrincipal Jwt jwt,
                        @RequestParam("file") MultipartFile file) {
                LicenseOcrResponse data = customerService.scanMyLicenseWithOcr(resolveUserId(jwt), file);
                return ResponseEntity.ok(ApiResponse.<LicenseOcrResponse>builder()
                                .code(1000)
                                .message("License OCR success")
                                .result(data)
                                .build());
        }

        @GetMapping("/profile/favorites")
        public ResponseEntity<ApiResponse<List<VehicleResponse>>> listMyFavorites(@AuthenticationPrincipal Jwt jwt) {
                List<VehicleResponse> data = customerService.listMyFavorites(resolveUserId(jwt));
                return ResponseEntity.ok(ApiResponse.<List<VehicleResponse>>builder()
                                .code(1000)
                                .message("Success")
                                .result(data)
                                .build());
        }

        @PostMapping("/profile/favorites/{vehicleId}")
        public ResponseEntity<ApiResponse<List<VehicleResponse>>> addFavorite(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable Integer vehicleId) {
                List<VehicleResponse> data = customerService.addFavorite(resolveUserId(jwt), vehicleId);
                return ResponseEntity.ok(ApiResponse.<List<VehicleResponse>>builder()
                                .code(1000)
                                .message("Success")
                                .result(data)
                                .build());
        }

        @DeleteMapping("/profile/favorites/{vehicleId}")
        public ResponseEntity<ApiResponse<List<VehicleResponse>>> removeFavorite(
                        @AuthenticationPrincipal Jwt jwt,
                        @PathVariable Integer vehicleId) {
                List<VehicleResponse> data = customerService.removeFavorite(resolveUserId(jwt), vehicleId);
                return ResponseEntity.ok(ApiResponse.<List<VehicleResponse>>builder()
                                .code(1000)
                                .message("Success")
                                .result(data)
                                .build());
        }

        @PutMapping("/profile/password")
        public ResponseEntity<ApiResponse<Object>> changeMyPassword(
                        @AuthenticationPrincipal Jwt jwt,
                        @Valid @RequestBody ChangePasswordRequest request) {
                customerService.changeMyPassword(resolveUserId(jwt), request);
                return ResponseEntity.ok(ApiResponse.builder()
                                .code(1000)
                                .message("Password updated")
                                .build());
        }

        @PostMapping("/profile/email-otp/send")
        public ResponseEntity<ApiResponse<Object>> sendEmailOtpForProfileUpdate(
                        @AuthenticationPrincipal Jwt jwt,
                        @Valid @RequestBody SendEmailOtpRequest request) {
                customerService.sendEmailOtpForProfileUpdate(resolveUserId(jwt), request);
                return ResponseEntity.ok(ApiResponse.builder()
                                .code(1000)
                                .message("OTP sent")
                                .build());
        }

        @PostMapping("/profile/email-otp/verify")
        public ResponseEntity<ApiResponse<CustomerResponse>> verifyEmailOtpForProfileUpdate(
                        @AuthenticationPrincipal Jwt jwt,
                        @Valid @RequestBody VerifyEmailOtpRequest request) {
                CustomerResponse data = customerService.verifyEmailOtpForProfileUpdate(resolveUserId(jwt), request);
                return ResponseEntity.ok(ApiResponse.<CustomerResponse>builder()
                                .code(1000)
                                .message("Email updated")
                                .result(data)
                                .build());
        }

        @PatchMapping("/profile/phone")
        public ResponseEntity<ApiResponse<CustomerResponse>> updateMyPhone(
                        @AuthenticationPrincipal Jwt jwt,
                        @Valid @RequestBody UpdateMyPhoneRequest request) {
                CustomerResponse data = customerService.updateMyPhone(resolveUserId(jwt), request);
                return ResponseEntity.ok(ApiResponse.<CustomerResponse>builder()
                                .code(1000)
                                .message("Phone updated")
                                .result(data)
                                .build());
        }

        @PostMapping(value = "/profile/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<ApiResponse<String>> uploadMyAvatar(
                        @AuthenticationPrincipal Jwt jwt,
                        @RequestParam("file") MultipartFile file) {
                String avatarUrl = customerService.uploadMyAvatar(resolveUserId(jwt), file);
                return ResponseEntity.ok(ApiResponse.<String>builder()
                                .code(1000)
                                .message("Success")
                                .result(avatarUrl)
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

        @PatchMapping("/{id}/status")
        @PreAuthorize("hasAuthority('ROLE_ADMIN')")
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

        @PatchMapping("/{id}/license-verification")
        @PreAuthorize("hasAuthority('ROLE_ADMIN')")
        // Flow admin review GPLX: chi xu ly ho so PENDING, buoc nhap note khi REJECTED,
        // va set verifiedAt khi APPROVED.
        public ResponseEntity<ApiResponse<CustomerResponse>> reviewCustomerLicenseVerification(
                        @PathVariable Integer id,
                        @Valid @RequestBody UpdateCustomerLicenseVerificationRequest request) {
                CustomerResponse data = customerService.reviewCustomerLicenseVerification(id, request);
                return ResponseEntity.ok(ApiResponse.<CustomerResponse>builder()
                                .code(1000)
                                .message("License verification updated")
                                .result(data)
                                .build());
        }
}
