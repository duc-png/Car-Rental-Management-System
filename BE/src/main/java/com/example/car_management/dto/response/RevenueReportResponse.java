package com.example.car_management.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Response for revenue report (Admin: system-wide, Car Owner: own vehicles).
 * Params: fromDate, toDate (ISO date yyyy-MM-dd).
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
    /** Total revenue in the period. */
    private BigDecimal totalRevenue;
    /** Breakdown by period (e.g. by month). */
    private List<RevenuePeriodItem> breakdown;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RevenuePeriodItem {
        /** Label for the period, e.g. "2024-01" for month, "2024" for year. */
        private String periodLabel;
        private BigDecimal totalRevenue;
    }
}
