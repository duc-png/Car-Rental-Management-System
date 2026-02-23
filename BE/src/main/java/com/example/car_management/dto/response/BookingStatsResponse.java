package com.example.car_management.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Booking statistics (Admin: system-wide, Car Owner: own vehicles).
 * Params: fromDate, toDate, granularity (DAILY | WEEKLY | MONTHLY).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookingStatsResponse {

    private LocalDate periodFrom;
    private LocalDate periodTo;
    /** DAILY, WEEKLY, or MONTHLY. */
    private String granularity;
    private List<BookingStatsItem> items;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BookingStatsItem {
        /** Period label, e.g. "2024-01-15", "2024-W03", "2024-01". */
        private String periodLabel;
        private long count;
    }
}
