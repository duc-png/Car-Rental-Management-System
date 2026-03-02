package com.example.car_management.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleModelResponse {
    private Integer id;
    private String name;

    private Integer brandId;
    private String brandName;

    private Integer typeId;
    private String typeName;
}
