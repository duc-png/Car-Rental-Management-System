package com.example.car_management.dto.request;

import com.example.car_management.entity.enums.IncidentReportCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateIncidentReportRequest {

    @NotNull(message = "Booking ID is required")
    private Integer bookingId;

    @NotNull(message = "Category is required")
    private IncidentReportCategory category;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 3000, message = "Description must be between 10 and 3000 characters")
    private String description;

    private List<String> evidenceUrls;
}
