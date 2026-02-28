package com.example.car_management.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LocationInputRequest {

    @Size(max = 100)
    private String province;

    @Size(max = 100)
    private String ward;

    @Size(max = 255)
    private String addressDetail;
}
