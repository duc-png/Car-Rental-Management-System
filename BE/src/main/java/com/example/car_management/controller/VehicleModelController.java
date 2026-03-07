package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.request.CreateVehicleModelRequest;
import com.example.car_management.dto.response.VehicleModelResponse;
import com.example.car_management.entity.BrandEntity;
import com.example.car_management.entity.CarTypeEntity;
import com.example.car_management.entity.VehicleModelEntity;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.repository.BrandRepository;
import com.example.car_management.repository.CarTypeRepository;
import com.example.car_management.repository.VehicleModelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;

import java.util.Comparator;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/vehicle-models")
public class VehicleModelController {

        private final VehicleModelRepository vehicleModelRepository;
        private final BrandRepository brandRepository;
        private final CarTypeRepository carTypeRepository;

        private static final String DEFAULT_CAR_TYPE_NAME = "Unknown";

        @GetMapping
        public ResponseEntity<ApiResponse<List<VehicleModelResponse>>> list() {
                List<VehicleModelEntity> models = vehicleModelRepository.findAllWithBrandAndType();

                List<VehicleModelResponse> data = models.stream()
                                .map(model -> VehicleModelResponse.builder()
                                                .id(model.getId())
                                                .name(model.getName())
                                                .brandId(model.getBrand() != null ? model.getBrand().getId() : null)
                                                .brandName(model.getBrand() != null ? model.getBrand().getName() : null)
                                                .typeId(model.getType() != null ? model.getType().getId() : null)
                                                .typeName(model.getType() != null ? model.getType().getName() : null)
                                                .build())
                                .sorted(Comparator
                                                .comparing((VehicleModelResponse item) -> item.getBrandName() == null
                                                                ? ""
                                                                : item.getBrandName(), String.CASE_INSENSITIVE_ORDER)
                                                .thenComparing(item -> item.getName() == null ? "" : item.getName(),
                                                                String.CASE_INSENSITIVE_ORDER))
                                .toList();

                return ResponseEntity.ok(ApiResponse.<List<VehicleModelResponse>>builder()
                                .code(1000)
                                .message("Success")
                                .result(data)
                                .build());
        }

        @PostMapping
        @PreAuthorize("hasAnyAuthority('ROLE_CAR_OWNER','ROLE_ADMIN')")
        // Flow tao model xe: normalize input, tim model theo cap brand-model; neu chua
        // co thi tao moi, neu da co thi co the cap nhat type tu Unknown.
        public ResponseEntity<ApiResponse<VehicleModelResponse>> create(
                        @Valid @RequestBody CreateVehicleModelRequest req) {
                String brandName = normalize(req.getBrandName());
                String modelName = normalize(req.getModelName());
                String typeName = normalize(req.getTypeName());

                if (brandName == null || brandName.isBlank() || modelName == null || modelName.isBlank()) {
                        throw new AppException(ErrorCode.INVALID_KEY);
                }

                VehicleModelEntity existing = vehicleModelRepository
                                .findByNameIgnoreCaseAndBrand_NameIgnoreCase(modelName, brandName)
                                .orElse(null);

                if (existing == null) {
                        BrandEntity brand = brandRepository.findByNameIgnoreCase(brandName)
                                        .orElseGet(() -> brandRepository
                                                        .save(BrandEntity.builder().name(brandName).build()));

                        String finalTypeName = (typeName == null || typeName.isBlank()) ? DEFAULT_CAR_TYPE_NAME
                                        : typeName;
                        CarTypeEntity type = carTypeRepository.findByNameIgnoreCase(finalTypeName)
                                        .orElseGet(() -> carTypeRepository
                                                        .save(CarTypeEntity.builder().name(finalTypeName).build()));

                        VehicleModelEntity created = VehicleModelEntity.builder()
                                        .brand(brand)
                                        .type(type)
                                        .name(modelName)
                                        .build();
                        existing = vehicleModelRepository.save(created);
                } else {
                        // Nếu model đã tồn tại nhưng type đang là Unknown -> cho phép cập nhật type khi
                        // client gửi typeName.
                        String existingTypeName = existing.getType() != null ? normalize(existing.getType().getName())
                                        : null;
                        boolean existingUnknown = existingTypeName == null || existingTypeName.isBlank()
                                        || DEFAULT_CAR_TYPE_NAME.equalsIgnoreCase(existingTypeName);
                        boolean incomingValid = typeName != null && !typeName.isBlank()
                                        && !DEFAULT_CAR_TYPE_NAME.equalsIgnoreCase(typeName);
                        if (existingUnknown && incomingValid) {
                                CarTypeEntity type = carTypeRepository.findByNameIgnoreCase(typeName)
                                                .orElseGet(() -> carTypeRepository
                                                                .save(CarTypeEntity.builder().name(typeName).build()));
                                existing.setType(type);
                                existing = vehicleModelRepository.save(existing);
                        }
                }

                VehicleModelResponse data = VehicleModelResponse.builder()
                                .id(existing.getId())
                                .name(existing.getName())
                                .brandId(existing.getBrand() != null ? existing.getBrand().getId() : null)
                                .brandName(existing.getBrand() != null ? existing.getBrand().getName() : null)
                                .typeId(existing.getType() != null ? existing.getType().getId() : null)
                                .typeName(existing.getType() != null ? existing.getType().getName() : null)
                                .build();

                return ResponseEntity.ok(ApiResponse.<VehicleModelResponse>builder()
                                .code(1000)
                                .message("Success")
                                .result(data)
                                .build());
        }

        private String normalize(String value) {
                return value == null ? null : value.trim();
        }
}
