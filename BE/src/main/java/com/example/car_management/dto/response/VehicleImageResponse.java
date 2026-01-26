package com.example.car_management.dto.response;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class VehicleImageResponse {
    private Integer id;
    private String imageUrl;
    private Boolean isMain;
}
