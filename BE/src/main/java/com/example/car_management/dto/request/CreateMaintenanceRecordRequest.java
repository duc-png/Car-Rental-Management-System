package com.example.car_management.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CreateMaintenanceRecordRequest {

    @NotNull
    private Integer vehicleId;

    private Integer customerId;

    @Size(max = 500)
    private String description;

    @Size(max = 100)
    private String serviceType;

    private Integer odometerKm;

    private LocalDateTime scheduledAt;
}

