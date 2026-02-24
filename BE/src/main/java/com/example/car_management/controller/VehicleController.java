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
    public ResponseEntity<ApiResponse<List<VehicleResponse>>> list(@RequestParam(required = false) Integer ownerId) {
        List<VehicleResponse> data = vehicleService.listVehicles(ownerId);
        return ResponseEntity.ok(ApiResponse.<List<VehicleResponse>>builder()
                .code(1000).message("Success").result(data).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VehicleResponse>> update(
            @PathVariable Integer id,
            @RequestParam Integer ownerId,
            @Valid @RequestBody UpdateVehicleRequest req
    ) {
        VehicleResponse data = vehicleService.updateVehicle(id, ownerId, req);
        return ResponseEntity.ok(ApiResponse.<VehicleResponse>builder()
                .code(1000).message("Success").result(data).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> delete(
            @PathVariable Integer id,
            @RequestParam Integer ownerId
    ) {
        vehicleService.deleteVehicle(id, ownerId);
        return ResponseEntity.ok(ApiResponse.builder()
                .code(1000).message("Deleted").build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<VehicleResponse>> updateStatus(
            @PathVariable Integer id,
            @RequestParam Integer ownerId,
            @Valid @RequestBody UpdateVehicleStatusRequest req
    ) {
        VehicleResponse data = vehicleService.updateStatus(id, ownerId, req);
        return ResponseEntity.ok(ApiResponse.<VehicleResponse>builder()
                .code(1000).message("Success").result(data).build());
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<AvailabilityResponse>> availability(
            @PathVariable Integer id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        AvailabilityResponse data = vehicleService.checkAvailability(id, from, to);
        return ResponseEntity.ok(ApiResponse.<AvailabilityResponse>builder()
                .code(1000).message("Success").result(data).build());
    }

    @PostMapping("/{id}/images")
    public ResponseEntity<ApiResponse<List<VehicleImageResponse>>> addImages(
            @PathVariable Integer id,
            @RequestParam Integer ownerId,
            @Valid @RequestBody AddVehicleImagesRequest req
    ) {
        List<VehicleImageResponse> data = vehicleService.addImages(id, ownerId, req);
        return ResponseEntity.ok(ApiResponse.<List<VehicleImageResponse>>builder()
                .code(1000).message("Success").result(data).build());
    }

    @PatchMapping("/{id}/images/{imageId}/main")
    public ResponseEntity<ApiResponse<List<VehicleImageResponse>>> setMain(
            @PathVariable Integer id,
            @PathVariable Integer imageId,
            @RequestParam Integer ownerId
    ) {
        List<VehicleImageResponse> data = vehicleService.setMainImage(id, ownerId, imageId);
        return ResponseEntity.ok(ApiResponse.<List<VehicleImageResponse>>builder()
                .code(1000).message("Success").result(data).build());
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public ResponseEntity<ApiResponse<Object>> deleteImage(
            @PathVariable Integer id,
            @PathVariable Integer imageId,
            @RequestParam Integer ownerId
    ) {
        vehicleService.deleteImage(id, ownerId, imageId);
        return ResponseEntity.ok(ApiResponse.builder()
                .code(1000).message("Deleted").build());
    }
    @PostMapping(
            value = "/{id}/images/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> uploadImages(
            @PathVariable Integer id,
            @RequestParam Integer ownerId,
            @RequestParam(required = false) Boolean setFirstAsMain,
            @RequestParam("files") List<MultipartFile> files
    ) {
        return ResponseEntity.ok(vehicleService.uploadImages(id, ownerId, files, setFirstAsMain));
    }

}
