package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.response.BookingStatsResponse;
import com.example.car_management.dto.response.RevenueReportResponse;
import com.example.car_management.dto.response.UsageReportResponse;
import com.example.car_management.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Reporting & Analytics API.
 * Standard query params: fromDate, toDate (ISO date yyyy-MM-dd), granularity (DAILY | WEEKLY | MONTHLY for stats).
 */
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * Revenue report. Admin: system-wide. Car Owner: own vehicles.
     * Params: fromDate (required), toDate (required).
     */
    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<RevenueReportResponse>> getRevenueReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        RevenueReportResponse result = reportService.getRevenueReport(fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.<RevenueReportResponse>builder()
                .code(1000)
                .message("Success")
                .result(result)
                .build());
    }

    /**
     * Car usage report. Car Owner only.
     * Params: fromDate (required), toDate (required).
     */
    @GetMapping("/usage")
    public ResponseEntity<ApiResponse<UsageReportResponse>> getUsageReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        UsageReportResponse result = reportService.getUsageReport(fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.<UsageReportResponse>builder()
                .code(1000)
                .message("Success")
                .result(result)
                .build());
    }

    /**
     * Booking statistics. Admin: system-wide. Car Owner: own vehicles.
     * Params: fromDate (required), toDate (required), granularity (optional, default DAILY): DAILY | WEEKLY | MONTHLY.
     */
    @GetMapping("/bookings/stats")
    public ResponseEntity<ApiResponse<BookingStatsResponse>> getBookingStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false, defaultValue = "DAILY") String granularity) {
        BookingStatsResponse result = reportService.getBookingStats(fromDate, toDate, granularity);
        return ResponseEntity.ok(ApiResponse.<BookingStatsResponse>builder()
                .code(1000)
                .message("Success")
                .result(result)
                .build());
    }
}
