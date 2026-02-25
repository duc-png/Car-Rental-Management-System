package com.example.car_management.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminOwnerRegistrationDecisionRequest {
    @Size(max = 500)
    private String note;
}
