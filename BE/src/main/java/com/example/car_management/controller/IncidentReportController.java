package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.request.CreateIncidentReportAppealRequest;
import com.example.car_management.dto.request.CreateIncidentReportRequest;
import com.example.car_management.dto.request.IncidentReportDecisionRequest;
import com.example.car_management.dto.request.ReviewIncidentReportAppealRequest;
import com.example.car_management.dto.response.IncidentReportResponse;
import com.example.car_management.service.IncidentReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/incident-reports")
@RequiredArgsConstructor
public class IncidentReportController {

    private final IncidentReportService incidentReportService;

    @PostMapping
    public ResponseEntity<ApiResponse<IncidentReportResponse>> createReport(
            @Valid @RequestBody CreateIncidentReportRequest request) {
        IncidentReportResponse result = incidentReportService.createReport(request);
        return ResponseEntity.ok(ApiResponse.<IncidentReportResponse>builder()
                .code(1000)
                .message("Report created successfully")
                .result(result)
                .build());
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<IncidentReportResponse>>> getMyReports() {
        List<IncidentReportResponse> result = incidentReportService.getMyReports();
        return ResponseEntity.ok(ApiResponse.<List<IncidentReportResponse>>builder()
                .code(1000)
                .message("Success")
                .result(result)
                .build());
    }

    @GetMapping("/owner")
    public ResponseEntity<ApiResponse<List<IncidentReportResponse>>> getOwnerVisibleReports() {
        List<IncidentReportResponse> result = incidentReportService.getOwnerVisibleReports();
        return ResponseEntity.ok(ApiResponse.<List<IncidentReportResponse>>builder()
                .code(1000)
                .message("Success")
                .result(result)
                .build());
    }

    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<List<IncidentReportResponse>>> getAdminReports() {
        List<IncidentReportResponse> result = incidentReportService.getAllForAdmin();
        return ResponseEntity.ok(ApiResponse.<List<IncidentReportResponse>>builder()
                .code(1000)
                .message("Success")
                .result(result)
                .build());
    }

    @PatchMapping("/{reportId}/decision")
    public ResponseEntity<ApiResponse<IncidentReportResponse>> decideReport(
            @PathVariable Integer reportId,
            @Valid @RequestBody IncidentReportDecisionRequest request) {
        IncidentReportResponse result = incidentReportService.decideReport(reportId, request);
        return ResponseEntity.ok(ApiResponse.<IncidentReportResponse>builder()
                .code(1000)
                .message("Decision updated")
                .result(result)
                .build());
    }

    @PostMapping("/{reportId}/appeal")
    public ResponseEntity<ApiResponse<IncidentReportResponse>> createAppeal(
            @PathVariable Integer reportId,
            @Valid @RequestBody CreateIncidentReportAppealRequest request) {
        IncidentReportResponse result = incidentReportService.createAppeal(reportId, request);
        return ResponseEntity.ok(ApiResponse.<IncidentReportResponse>builder()
                .code(1000)
                .message("Appeal submitted")
                .result(result)
                .build());
    }

    @PatchMapping("/{reportId}/appeal/review")
    public ResponseEntity<ApiResponse<IncidentReportResponse>> reviewAppeal(
            @PathVariable Integer reportId,
            @Valid @RequestBody ReviewIncidentReportAppealRequest request) {
        IncidentReportResponse result = incidentReportService.reviewAppeal(reportId, request);
        return ResponseEntity.ok(ApiResponse.<IncidentReportResponse>builder()
                .code(1000)
                .message("Appeal reviewed")
                .result(result)
                .build());
    }
}
