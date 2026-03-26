package com.example.car_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateIncidentReportAppealRequest {

    @NotBlank(message = "Appeal content is required")
    @Size(min = 10, max = 2000, message = "Appeal content must be between 10 and 2000 characters")
    private String appealContent;

    private List<String> evidenceUrls;
}
