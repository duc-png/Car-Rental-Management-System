package com.example.car_management.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StartConversationRequest {
    @NotNull(message = "vehicleId is required")
    private Integer vehicleId;
}
