package com.example.car_management.dto.request;

import com.example.car_management.entity.enums.IncidentReportStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentReportDecisionRequest {

    @NotNull(message = "Decision status is required")
    private IncidentReportStatus status;

    private String decisionNote;
}
