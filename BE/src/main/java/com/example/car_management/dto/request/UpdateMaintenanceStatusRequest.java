package com.example.car_management.dto.request;

import com.example.car_management.entity.enums.MaintenanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UpdateMaintenanceStatusRequest {

    @NotNull
    private MaintenanceStatus status;

    private String note;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;
}

