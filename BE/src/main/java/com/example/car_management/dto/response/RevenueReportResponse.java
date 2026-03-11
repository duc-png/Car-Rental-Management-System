package com.example.car_management.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
     * Response for revenue report (Admin: system-wide, Car Owner: own vehicles).
     * Params: fromDate, toDate (ISO date yyyy-MM-dd), granularity (DAILY | MONTHLY | QUARTERLY | YEARLY).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RevenueReportResponse {

    /** Start of report period (inclusive). */
    private LocalDate periodFrom;
    /** End of report period (inclusive). */
    private LocalDate periodTo;
    /** Granularity used for grouping: DAILY, MONTHLY, QUARTERLY, or YEARLY. */
    private String granularity;
    /** Backwards-compatible total revenue field (mirrors totalBookedRevenue). */
    private BigDecimal totalRevenue;
    /** Total booked revenue (from bookings.totalPrice) in the period. */
    private BigDecimal totalBookedRevenue;
    /** Total cash collected (from payments.amount with SUCCESS status) in the period. */
    private BigDecimal totalCashCollected;
    /** Breakdown by period (e.g. by day/month/quarter/year). */
    private List<RevenuePeriodItem> breakdown;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RevenuePeriodItem {
        /** Label for the period, e.g. "2024-01-15" for day, "2024-01" for month, "2024-Q1" for quarter, "2024" for year. */
        private String periodLabel;
        /** Backwards-compatible field used by FE charts (mirrors bookedRevenue). */
        private BigDecimal totalRevenue;
        /** Booked revenue for this period. */
        private BigDecimal bookedRevenue;
        /** Cash collected for this period. */
        private BigDecimal cashCollected;
    }
}
