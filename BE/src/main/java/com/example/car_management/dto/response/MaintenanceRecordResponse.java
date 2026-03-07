package com.example.car_management.dto.response;

import com.example.car_management.entity.enums.MaintenanceStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
public class MaintenanceRecordResponse {
    private Integer id;
    private Integer vehicleId;
    private String vehiclePlate;
    private Integer customerId;
    private String customerName;
    private String description;
    private String serviceType;
    private MaintenanceStatus status;
    private Integer odometerKm;
    private LocalDateTime scheduledAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private BigDecimal totalCost;
    private Instant createdAt;
    private Instant updatedAt;
    private List<MaintenanceCostItemResponse> costItems;
}

