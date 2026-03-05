package com.example.car_management.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Car usage report (Car Owner only).
 * Params: fromDate, toDate (ISO date yyyy-MM-dd).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UsageReportResponse {

    private LocalDate periodFrom;
    private LocalDate periodTo;
    /** Total number of bookings in the period. */
    private long totalBookingCount;
    /** Total rental days (sum of booking durations). */
    private long totalRentalDays;
    /** Per-vehicle breakdown. */
    private List<VehicleUsageItem> vehicleBreakdown;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VehicleUsageItem {
        private Integer vehicleId;
        private String vehicleDisplayName;
        private String licensePlate;
        private long bookingCount;
        private long totalRentalDays;
    }
}
