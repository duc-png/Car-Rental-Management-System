package com.example.car_management.dto.response;

import com.example.car_management.entity.enums.IncidentReportAppealStatus;
import com.example.car_management.entity.enums.IncidentReportCategory;
import com.example.car_management.entity.enums.IncidentReportStatus;
import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentReportResponse {

    private Integer id;
    private Integer bookingId;
    private Integer customerId;
    private String customerName;
    private Integer ownerId;
    private String ownerName;
    private Integer vehicleId;
    private String vehicleName;
    private IncidentReportCategory category;
    private String description;
    private List<String> evidenceUrls;
    private IncidentReportStatus status;
    private String decisionNote;
    private Instant decisionAt;
    private IncidentReportAppealStatus appealStatus;
    private String appealContent;
    private List<String> appealEvidenceUrls;
    private String appealDecisionNote;
    private Instant appealDecisionAt;
    private Instant createdAt;
    private Instant updatedAt;
}
