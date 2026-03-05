package com.example.car_management.service;

import com.example.car_management.dto.response.BookingStatsResponse;
import com.example.car_management.dto.response.RevenueReportResponse;
import com.example.car_management.dto.response.UsageReportResponse;

import java.time.LocalDate;

public interface ReportService {

    /**
     * Revenue report. Admin: system-wide (ownerId=null). Car Owner: own vehicles only.
     * @param fromDate start date (inclusive)
     * @param toDate end date (inclusive)
     */
    RevenueReportResponse getRevenueReport(LocalDate fromDate, LocalDate toDate);

    /**
     * Car usage report. Car Owner only.
     */
    UsageReportResponse getUsageReport(LocalDate fromDate, LocalDate toDate);

    /**
     * Booking statistics. Admin: system-wide. Car Owner: own vehicles.
     * @param granularity DAILY, WEEKLY, or MONTHLY
     */
    BookingStatsResponse getBookingStats(LocalDate fromDate, LocalDate toDate, String granularity);
}
