package com.example.car_management.dto.request;

import com.example.car_management.entity.enums.IncidentReportStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewIncidentReportAppealRequest {

    @NotNull(message = "Approve flag is required")
    private Boolean approve;

    private IncidentReportStatus updatedStatus;

    private String decisionNote;
}
