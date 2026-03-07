package com.example.car_management.service.impl;

import com.example.car_management.dto.response.BookingStatsResponse;
import com.example.car_management.dto.response.RevenueReportResponse;
import com.example.car_management.dto.response.UsageReportResponse;
import com.example.car_management.entity.BookingEntity;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.entity.enums.UserRole;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.repository.BookingRepository;
import com.example.car_management.service.ReportService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.IsoFields;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReportServiceImpl implements ReportService {

    BookingRepository bookingRepository;
    com.example.car_management.repository.UserRepository userRepository;

    static final List<BookingStatus> REVENUE_AND_STATS_STATUSES = List.of(
            BookingStatus.CONFIRMED,
            BookingStatus.ONGOING,
            BookingStatus.COMPLETED);

    static final int MAX_DAYS_RANGE = 366;

    @Override
    @Transactional(readOnly = true)
    public RevenueReportResponse getRevenueReport(LocalDate fromDate, LocalDate toDate) {
        validateDateRange(fromDate, toDate);
        ReportContext ctx = resolveReportContext(true);
        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = toDate.plusDays(1).atStartOfDay();

        BigDecimal total = bookingRepository.sumRevenueByDateRange(from, to, REVENUE_AND_STATS_STATUSES, ctx.ownerId());
        if (total == null) total = BigDecimal.ZERO;

        List<Object[]> byMonth = bookingRepository.sumRevenueGroupedByMonth(from, to, REVENUE_AND_STATS_STATUSES, ctx.ownerId());
        List<RevenueReportResponse.RevenuePeriodItem> breakdown = byMonth.stream()
                .map(row -> RevenueReportResponse.RevenuePeriodItem.builder()
                        .periodLabel(String.format("%d-%02d", row[0], row[1]))
                        .totalRevenue((BigDecimal) row[2])
                        .build())
                .toList();

        return RevenueReportResponse.builder()
                .periodFrom(fromDate)
                .periodTo(toDate)
                .totalRevenue(total)
                .breakdown(breakdown)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UsageReportResponse getUsageReport(LocalDate fromDate, LocalDate toDate) {
        validateDateRange(fromDate, toDate);
        ReportContext ctx = resolveReportContextForOwnerOnly();

        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = toDate.plusDays(1).atStartOfDay();

        List<BookingEntity> bookings = bookingRepository.findBookingsForUsageReport(
                ctx.ownerId(), from, to, REVENUE_AND_STATS_STATUSES);

        long totalBookingCount = bookings.size();
        long totalRentalDays = 0;
        Map<Integer, VehicleUsageAccumulator> byVehicle = new LinkedHashMap<>();

        for (BookingEntity b : bookings) {
            VehicleEntity v = b.getVehicle();
            int vehicleId = v.getId();
            long days = java.time.Duration.between(b.getStartDate(), b.getEndDate()).toDays();
            if (days <= 0) days = 1;
            totalRentalDays += days;

            byVehicle.computeIfAbsent(vehicleId, id -> new VehicleUsageAccumulator(v))
                    .addBooking(days);
        }

        List<UsageReportResponse.VehicleUsageItem> vehicleBreakdown = byVehicle.values().stream()
                .map(VehicleUsageAccumulator::toItem)
                .toList();

        return UsageReportResponse.builder()
                .periodFrom(fromDate)
                .periodTo(toDate)
                .totalBookingCount(totalBookingCount)
                .totalRentalDays(totalRentalDays)
                .vehicleBreakdown(vehicleBreakdown)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BookingStatsResponse getBookingStats(LocalDate fromDate, LocalDate toDate, String granularity) {
        validateDateRange(fromDate, toDate);
        ReportContext ctx = resolveReportContext(true);

        String g = (granularity != null && !granularity.isBlank()) ? granularity.toUpperCase(Locale.ROOT) : "DAILY";
        if (!List.of("DAILY", "WEEKLY", "MONTHLY").contains(g)) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = toDate.plusDays(1).atStartOfDay();

        List<LocalDateTime> startDates = bookingRepository.findStartDatesForStats(from, to, ctx.ownerId(), REVENUE_AND_STATS_STATUSES);

        Map<String, Long> countByPeriod = new TreeMap<>();
        for (LocalDateTime start : startDates) {
            LocalDate d = start.toLocalDate();
            String key = switch (g) {
                case "DAILY" -> d.toString();
                case "WEEKLY" -> d.get(IsoFields.WEEK_BASED_YEAR) + "-W" + String.format("%02d", d.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR));
                default -> d.getYear() + "-" + String.format("%02d", d.getMonthValue());
            };
            countByPeriod.merge(key, 1L, Long::sum);
        }

        List<BookingStatsResponse.BookingStatsItem> items = countByPeriod.entrySet().stream()
                .map(e -> BookingStatsResponse.BookingStatsItem.builder()
                        .periodLabel(e.getKey())
                        .count(e.getValue())
                        .build())
                .toList();

        return BookingStatsResponse.builder()
                .periodFrom(fromDate)
                .periodTo(toDate)
                .granularity(g)
                .items(items)
                .build();
    }

    private void validateDateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        if (from.isAfter(to)) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        if (java.time.temporal.ChronoUnit.DAYS.between(from, to) > MAX_DAYS_RANGE) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
    }

    /** Admin: ownerId null. Car Owner (EXPERT): ownerId = current user. Otherwise forbidden. */
    private ReportContext resolveReportContext(boolean allowAdminAndOwner) {
        UserEntity user = getCurrentUser();
        UserRole role = user.getRoleId();
        if (role == null) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }
        if (role == UserRole.ADMIN) {
            return new ReportContext(null);
        }
        if (role == UserRole.CAR_OWNER) {
            return new ReportContext(user.getId());
        }
        throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
    }

    /** Only Car Owner (EXPERT). */
    private ReportContext resolveReportContextForOwnerOnly() {
        UserEntity user = getCurrentUser();
        if (user.getRoleId() != UserRole.CAR_OWNER) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }
        return new ReportContext(user.getId());
    }

    private UserEntity getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private record ReportContext(Integer ownerId) {}

    private static class VehicleUsageAccumulator {
        final VehicleEntity vehicle;
        int bookingCount;
        long totalRentalDays;

        VehicleUsageAccumulator(VehicleEntity vehicle) {
            this.vehicle = vehicle;
        }

        void addBooking(long days) {
            bookingCount++;
            totalRentalDays += days;
        }

        UsageReportResponse.VehicleUsageItem toItem() {
            String displayName = vehicle.getModel() != null && vehicle.getModel().getBrand() != null
                    ? vehicle.getModel().getBrand().getName() + " " + vehicle.getModel().getName()
                    : (vehicle.getModel() != null ? vehicle.getModel().getName() : "Vehicle #" + vehicle.getId());
            return UsageReportResponse.VehicleUsageItem.builder()
                    .vehicleId(vehicle.getId())
                    .vehicleDisplayName(displayName)
                    .licensePlate(vehicle.getLicensePlate())
                    .bookingCount(bookingCount)
                    .totalRentalDays(totalRentalDays)
                    .build();
        }
    }
}
