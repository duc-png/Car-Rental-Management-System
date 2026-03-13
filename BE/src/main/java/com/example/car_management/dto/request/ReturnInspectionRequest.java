package com.example.car_management.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReturnInspectionRequest {

    private String actualReturnDate;
    private Integer odometerStart;
    private Integer odometerEnd;
    private Integer allowedKm;
    private String fuelLevelStart;
    private String fuelLevelEnd;
    private String damageDescription;
    private Double damageFee;
    private String returnNotes;
}

