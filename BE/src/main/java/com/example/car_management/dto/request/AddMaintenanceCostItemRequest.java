package com.example.car_management.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class AddMaintenanceCostItemRequest {

    @NotNull
    private String category;

    private String description;

    private Integer quantity;

    private BigDecimal unitPrice;
}

