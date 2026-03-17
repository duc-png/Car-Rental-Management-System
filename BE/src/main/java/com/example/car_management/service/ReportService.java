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
     * @param granularity DAILY, MONTHLY, QUARTERLY, or YEARLY
     */
    RevenueReportResponse getRevenueReport(LocalDate fromDate, LocalDate toDate, String granularity);

    /**
     * Car usage report. Car Owner only.
     */
    UsageReportResponse getUsageReport(LocalDate fromDate, LocalDate toDate);

    /**
     * Booking statistics. Admin: system-wide. Car Owner: own vehicles.
     * @param granularity DAILY, WEEKLY, or MONTHLY
     */
    BookingStatsResponse getBookingStats(LocalDate fromDate, LocalDate toDate, String granularity);

    /**
     * Dev helper: seed a few COMPLETED bookings + matching payments so reports have demo data.
     * Intended for local testing only.
     */
    void seedDemoRevenueData();
}
