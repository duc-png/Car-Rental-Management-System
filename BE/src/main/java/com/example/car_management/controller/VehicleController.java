package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.request.*;
import com.example.car_management.dto.response.*;
import com.example.car_management.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/vehicles")
public class VehicleController {

        private final VehicleService vehicleService;

        // Flow tao xe: controller nhan request va service se tao ban ghi xe voi trang
        // thai PENDING_APPROVAL, sau do thong bao cho admin duyet.
        @PostMapping
        public ResponseEntity<ApiResponse<VehicleResponse>> create(@Valid @RequestBody CreateVehicleRequest req) {
                VehicleResponse data = vehicleService.createVehicle(req);
                return ResponseEntity.ok(ApiResponse.<VehicleResponse>builder()
                                .code(1000).message("Success").result(data).build());
        }

        @GetMapping("/{id}")
        public ResponseEntity<ApiResponse<VehicleResponse>> detail(@PathVariable Integer id) {
                VehicleResponse data = vehicleService.getVehicleDetail(id);
                return ResponseEntity.ok(ApiResponse.<VehicleResponse>builder()
                                .code(1000).message("Success").result(data).build());
        }

        @GetMapping
        public ResponseEntity<ApiResponse<List<VehicleResponse>>> list(
                        @RequestParam(required = false) Integer ownerId) {
                List<VehicleResponse> data = vehicleService.listVehicles(ownerId);
                return ResponseEntity.ok(ApiResponse.<List<VehicleResponse>>builder()
                                .code(1000).message("Success").result(data).build());
        }

        // Flow cap nhat xe: service xac thuc ownerId, chan sua immutable fields, roi
        // cap nhat cac truong duoc phep.
        @PutMapping("/{id}")
        public ResponseEntity<ApiResponse<VehicleResponse>> update(
                        @PathVariable Integer id,
                        @RequestParam Integer ownerId,
                        @Valid @RequestBody UpdateVehicleRequest req) {
                VehicleResponse data = vehicleService.updateVehicle(id, ownerId, req);
                return ResponseEntity.ok(ApiResponse.<VehicleResponse>builder()
                                .code(1000).message("Success").result(data).build());
        }

        // API cho chu xe xoa xe cua minh.
        @DeleteMapping("/{id}")
        public ResponseEntity<ApiResponse<Object>> delete(
                        @PathVariable Integer id,
                        @RequestParam Integer ownerId) {
                vehicleService.deleteVehicle(id, ownerId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .code(1000).message("Deleted").build());
        }

        // Flow doi trang thai xe: owner chi duoc doi trang thai khai thac, khong duoc
        // tu dua xe ve PENDING_APPROVAL/REJECTED.
        @PatchMapping("/{id}/status")
        public ResponseEntity<ApiResponse<VehicleResponse>> updateStatus(
                        @PathVariable Integer id,
                        @RequestParam Integer ownerId,
                        @Valid @RequestBody UpdateVehicleStatusRequest req) {
                VehicleResponse data = vehicleService.updateStatus(id, ownerId, req);
                return ResponseEntity.ok(ApiResponse.<VehicleResponse>builder()
                                .code(1000).message("Success").result(data).build());
        }

        @GetMapping("/{id}/availability")
        public ResponseEntity<ApiResponse<AvailabilityResponse>> availability(
                        @PathVariable Integer id,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
                AvailabilityResponse data = vehicleService.checkAvailability(id, from, to);
                return ResponseEntity.ok(ApiResponse.<AvailabilityResponse>builder()
                                .code(1000).message("Success").result(data).build());
        }

        @GetMapping("/{id}/calendar")
        public ResponseEntity<ApiResponse<VehicleCalendarResponse>> getCalendar(
                        @PathVariable Integer id,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
                VehicleCalendarResponse data = vehicleService.getVehicleCalendar(id, from, to);
                return ResponseEntity.ok(ApiResponse.<VehicleCalendarResponse>builder()
                                .code(1000).message("Success").result(data).build());
        }

        // Flow them anh URL: service validate ownership, xu ly set main (neu co) va
        // luu batch anh moi.
        @PostMapping("/{id}/images")
        public ResponseEntity<ApiResponse<List<VehicleImageResponse>>> addImages(
                        @PathVariable Integer id,
                        @RequestParam Integer ownerId,
                        @Valid @RequestBody AddVehicleImagesRequest req) {
                List<VehicleImageResponse> data = vehicleService.addImages(id, ownerId, req);
                return ResponseEntity.ok(ApiResponse.<List<VehicleImageResponse>>builder()
                                .code(1000).message("Success").result(data).build());
        }

        // API cho chu xe dat anh dai dien (main image) cho xe.
        @PatchMapping("/{id}/images/{imageId}/main")
        public ResponseEntity<ApiResponse<List<VehicleImageResponse>>> setMain(
                        @PathVariable Integer id,
                        @PathVariable Integer imageId,
                        @RequestParam Integer ownerId) {
                List<VehicleImageResponse> data = vehicleService.setMainImage(id, ownerId, imageId);
                return ResponseEntity.ok(ApiResponse.<List<VehicleImageResponse>>builder()
                                .code(1000).message("Success").result(data).build());
        }

        // API cho chu xe xoa anh cua xe.
        @DeleteMapping("/{id}/images/{imageId}")
        public ResponseEntity<ApiResponse<Object>> deleteImage(
                        @PathVariable Integer id,
                        @PathVariable Integer imageId,
                        @RequestParam Integer ownerId) {
                vehicleService.deleteImage(id, ownerId, imageId);
                return ResponseEntity.ok(ApiResponse.builder()
                                .code(1000).message("Deleted").build());
        }

        // Flow upload anh file: upload len cloud, luu URL vao DB, co the dat anh dau
        // tien
        // lam main.
        @PostMapping(value = "/{id}/images/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<?> uploadImages(
                        @PathVariable Integer id,
                        @RequestParam Integer ownerId,
                        @RequestParam(required = false) Boolean setFirstAsMain,
                        @RequestParam("files") List<MultipartFile> files) {
                return ResponseEntity.ok(vehicleService.uploadImages(id, ownerId, files, setFirstAsMain));
        }

        // Flow duyet xe: chi nhan xe dang PENDING_APPROVAL, set AVAILABLE + reviewedAt
        // va gui thong bao cho chu xe.
        @PatchMapping("/{id}/approve")
        @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ADMIN')")
        public ResponseEntity<ApiResponse<VehicleResponse>> approve(@PathVariable Integer id) {
                VehicleResponse data = vehicleService.approveVehicle(id);
                return ResponseEntity.ok(ApiResponse.<VehicleResponse>builder()
                                .code(1000).message("Approved").result(data).build());
        }

        // Flow tu choi xe: chi nhan xe dang PENDING_APPROVAL, set REJECTED va gui ly do
        // cho chu xe.
        @PatchMapping("/{id}/reject")
        @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ADMIN')")
        public ResponseEntity<ApiResponse<VehicleResponse>> reject(
                        @PathVariable Integer id,
                        @RequestBody(required = false) RejectVehicleRequest req,
                        @RequestParam(required = false) String reason) {
                String resolvedReason = (req != null && req.getReason() != null && !req.getReason().isBlank())
                                ? req.getReason()
                                : reason;
                VehicleResponse data = vehicleService.rejectVehicle(id, resolvedReason);
                return ResponseEntity.ok(ApiResponse.<VehicleResponse>builder()
                                .code(1000).message("Rejected").result(data).build());
        }

        @PostMapping("/search")
        public ResponseEntity<ApiResponse<List<VehicleResponse>>> search(@Valid @RequestBody VehicleSearchRequest req) {
                List<VehicleResponse> data = vehicleService.searchVehicles(req);
                return ResponseEntity.ok(ApiResponse.<List<VehicleResponse>>builder()
                                .code(1000).message("Success").result(data).build());
        }

}
