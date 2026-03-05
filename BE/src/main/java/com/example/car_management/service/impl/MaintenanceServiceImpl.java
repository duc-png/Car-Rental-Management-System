package com.example.car_management.service.impl;

import com.example.car_management.dto.request.AddMaintenanceCostItemRequest;
import com.example.car_management.dto.request.CreateMaintenanceRecordRequest;
import com.example.car_management.dto.request.UpdateMaintenanceStatusRequest;
import com.example.car_management.dto.response.MaintenanceCostItemResponse;
import com.example.car_management.dto.response.MaintenanceRecordResponse;
import com.example.car_management.entity.MaintenanceCostItemEntity;
import com.example.car_management.entity.MaintenanceRecordEntity;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.entity.enums.MaintenanceStatus;
import com.example.car_management.entity.enums.VehicleStatus;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.repository.MaintenanceRecordRepository;
import com.example.car_management.repository.UserRepository;
import com.example.car_management.repository.VehicleRepository;
import com.example.car_management.service.MaintenanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRecordRepository maintenanceRecordRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public MaintenanceRecordResponse createRecord(CreateMaintenanceRecordRequest request) {
        VehicleEntity vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

        // Kiểm tra quyền sở hữu xe
        validateVehicleOwnership(vehicle);

        // Kiểm tra trạng thái xe phải là AVAILABLE hoặc MAINTENANCE
        if (vehicle.getStatus() != VehicleStatus.AVAILABLE && 
            vehicle.getStatus() != VehicleStatus.MAINTENANCE) {
            throw new AppException(ErrorCode.VEHICLE_NOT_AVAILABLE_FOR_MAINTENANCE);
        }

        // Kiểm tra xe không có maintenance đang active
        List<MaintenanceStatus> activeStatuses = Arrays.asList(
            MaintenanceStatus.SCHEDULED, 
            MaintenanceStatus.IN_PROGRESS
        );
        boolean hasActiveMaintenance = maintenanceRecordRepository
                .existsByVehicleIdAndStatusIn(request.getVehicleId(), activeStatuses);
        
        if (hasActiveMaintenance) {
            throw new AppException(ErrorCode.MAINTENANCE_ALREADY_EXISTS);
        }

        UserEntity customer = null;
        if (request.getCustomerId() != null) {
            customer = userRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        }

        Instant now = Instant.now();

        MaintenanceRecordEntity entity = MaintenanceRecordEntity.builder()
                .vehicle(vehicle)
                .customer(customer)
                .description(request.getDescription())
                .serviceType(request.getServiceType())
                .status(MaintenanceStatus.SCHEDULED)
                .odometerKm(request.getOdometerKm())
                .scheduledAt(request.getScheduledAt())
                .totalCost(BigDecimal.ZERO)
                .createdAt(now)
                .updatedAt(now)
                .build();
        
        vehicle.setStatus(VehicleStatus.MAINTENANCE);
        vehicleRepository.save(vehicle);
        
        MaintenanceRecordEntity saved = maintenanceRecordRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public MaintenanceRecordResponse updateStatus(Integer id, UpdateMaintenanceStatusRequest request) {
        MaintenanceRecordEntity entity = maintenanceRecordRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MAINTENANCE_NOT_FOUND));

        // Kiểm tra quyền sở hữu xe
        validateVehicleOwnership(entity.getVehicle());

        // Validate status transition
        validateStatusTransition(entity.getStatus(), request.getStatus());

        entity.setStatus(request.getStatus());
        if (request.getStartedAt() != null) {
            entity.setStartedAt(request.getStartedAt());
        }
        if (request.getCompletedAt() != null) {
            entity.setCompletedAt(request.getCompletedAt());
        }
        entity.setUpdatedAt(Instant.now());

        // Đồng bộ trạng thái xe theo trạng thái bảo dưỡng
        VehicleEntity vehicle = entity.getVehicle();
        if (vehicle != null) {
            MaintenanceStatus newStatus = request.getStatus();
            if (newStatus == MaintenanceStatus.IN_PROGRESS || newStatus == MaintenanceStatus.SCHEDULED) {
                vehicle.setStatus(VehicleStatus.MAINTENANCE);
            } else if (newStatus == MaintenanceStatus.COMPLETED || newStatus == MaintenanceStatus.CANCELLED) {
                // Khi kết thúc/hủy bảo dưỡng, cho xe trở lại AVAILABLE nếu đang là MAINTENANCE
                if (vehicle.getStatus() == VehicleStatus.MAINTENANCE) {
                    vehicle.setStatus(VehicleStatus.AVAILABLE);
                }
            }
            vehicleRepository.save(vehicle);
        }

        MaintenanceRecordEntity saved = maintenanceRecordRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public MaintenanceRecordResponse addCostItem(Integer id, AddMaintenanceCostItemRequest request) {
        MaintenanceRecordEntity entity = maintenanceRecordRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MAINTENANCE_NOT_FOUND));

        // Kiểm tra quyền sở hữu xe
        validateVehicleOwnership(entity.getVehicle());

        // Không cho phép thêm cost cho maintenance đã hoàn thành hoặc hủy
        if (entity.getStatus() == MaintenanceStatus.COMPLETED || 
            entity.getStatus() == MaintenanceStatus.CANCELLED) {
            throw new AppException(ErrorCode.MAINTENANCE_CANNOT_MODIFY_COMPLETED);
        }

        int quantity = request.getQuantity() != null ? request.getQuantity() : 1;
        BigDecimal unitPrice = request.getUnitPrice() != null ? request.getUnitPrice() : BigDecimal.ZERO;
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(quantity));

        MaintenanceCostItemEntity item = MaintenanceCostItemEntity.builder()
                .maintenanceRecord(entity)
                .category(request.getCategory())
                .description(request.getDescription())
                .quantity(quantity)
                .unitPrice(unitPrice)
                .totalPrice(totalPrice)
                .build();

        entity.getCostItems().add(item);

        BigDecimal newTotal = entity.getCostItems().stream()
                .map(MaintenanceCostItemEntity::getTotalPrice)
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        entity.setTotalCost(newTotal);
        entity.setUpdatedAt(Instant.now());

        MaintenanceRecordEntity saved = maintenanceRecordRepository.save(entity);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public MaintenanceRecordResponse getById(Integer id) {
        MaintenanceRecordEntity entity = maintenanceRecordRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MAINTENANCE_NOT_FOUND));
        return toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaintenanceRecordResponse> listByVehicle(Integer vehicleId) {
        return maintenanceRecordRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaintenanceRecordResponse> listByCustomer(Integer customerId) {
        return maintenanceRecordRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private void validateVehicleOwnership(VehicleEntity vehicle) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        String currentEmail = authentication.getName();
        UserEntity currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Kiểm tra user hiện tại có phải owner của xe không
        if (vehicle.getOwner() == null || !vehicle.getOwner().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.VEHICLE_OWNERSHIP_REQUIRED);
        }
    }

    private void validateStatusTransition(MaintenanceStatus currentStatus, MaintenanceStatus newStatus) {
        // Không thể thay đổi nếu đã COMPLETED hoặc CANCELLED
        if (currentStatus == MaintenanceStatus.COMPLETED || currentStatus == MaintenanceStatus.CANCELLED) {
            throw new AppException(ErrorCode.MAINTENANCE_CANNOT_MODIFY_COMPLETED);
        }

        // Valid transitions:
        // SCHEDULED -> IN_PROGRESS, CANCELLED
        // IN_PROGRESS -> COMPLETED, CANCELLED
        boolean isValidTransition = false;

        switch (currentStatus) {
            case SCHEDULED:
                if (newStatus == MaintenanceStatus.IN_PROGRESS || 
                    newStatus == MaintenanceStatus.CANCELLED) {
                    isValidTransition = true;
                }
                break;
            case IN_PROGRESS:
                if (newStatus == MaintenanceStatus.COMPLETED || 
                    newStatus == MaintenanceStatus.CANCELLED) {
                    isValidTransition = true;
                }
                break;
            default:
                break;
        }

        if (!isValidTransition) {
            throw new AppException(ErrorCode.MAINTENANCE_INVALID_STATUS_TRANSITION);
        }
    }

    private MaintenanceRecordResponse toResponse(MaintenanceRecordEntity entity) {
        List<MaintenanceCostItemResponse> items = entity.getCostItems() == null ? List.of()
                : entity.getCostItems().stream()
                .map(item -> MaintenanceCostItemResponse.builder()
                        .id(item.getId())
                        .category(item.getCategory())
                        .description(item.getDescription())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .collect(Collectors.toList());

        return MaintenanceRecordResponse.builder()
                .id(entity.getId())
                .vehicleId(entity.getVehicle() != null ? entity.getVehicle().getId() : null)
                .vehiclePlate(entity.getVehicle() != null ? entity.getVehicle().getLicensePlate() : null)
                .customerId(entity.getCustomer() != null ? entity.getCustomer().getId() : null)
                .customerName(entity.getCustomer() != null ? entity.getCustomer().getFullName() : null)
                .description(entity.getDescription())
                .serviceType(entity.getServiceType())
                .status(entity.getStatus())
                .odometerKm(entity.getOdometerKm())
                .scheduledAt(entity.getScheduledAt())
                .startedAt(entity.getStartedAt())
                .completedAt(entity.getCompletedAt())
                .totalCost(entity.getTotalCost())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .costItems(items)
                .build();
    }
}

