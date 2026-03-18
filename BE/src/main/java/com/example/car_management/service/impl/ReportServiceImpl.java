package com.example.car_management.service.impl;

import com.example.car_management.dto.response.BookingStatsResponse;
import com.example.car_management.dto.response.RevenueReportResponse;
import com.example.car_management.dto.response.UsageReportResponse;
import com.example.car_management.entity.BookingEntity;
import com.example.car_management.entity.PaymentEntity;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.entity.enums.PaymentMethod;
import com.example.car_management.entity.enums.PaymentType;
import com.example.car_management.entity.enums.TransactionStatus;
import com.example.car_management.entity.enums.UserRole;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.repository.BookingRepository;
import com.example.car_management.repository.PaymentRepository;
import com.example.car_management.repository.VehicleRepository;
import com.example.car_management.service.ReportService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.IsoFields;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReportServiceImpl implements ReportService {

    BookingRepository bookingRepository;
    PaymentRepository paymentRepository;
    VehicleRepository vehicleRepository;
    com.example.car_management.repository.UserRepository userRepository;

    // Booking statuses counted as "successful/finished" for revenue calculations
    static final List<BookingStatus> REVENUE_STATUSES = List.of(
            BookingStatus.COMPLETED
    );

    // Booking statuses considered as active/successful for usage and stats
    static final List<BookingStatus> REVENUE_AND_STATS_STATUSES = List.of(
            BookingStatus.CONFIRMED,
            BookingStatus.ONGOING,
            BookingStatus.COMPLETED);

    static final int MAX_DAYS_RANGE = 366;

    @Override
    @Transactional(readOnly = true)
    public RevenueReportResponse getRevenueReport(LocalDate fromDate, LocalDate toDate, String granularity) {
        validateDateRange(fromDate, toDate);
        ReportContext ctx = resolveReportContext(true);
        String g = (granularity != null && !granularity.isBlank())
                ? granularity.toUpperCase(Locale.ROOT)
                : "MONTHLY";
        if (!List.of("DAILY", "MONTHLY", "QUARTERLY", "YEARLY").contains(g)) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        LocalDateTime from = fromDate.atStartOfDay();
        LocalDateTime to = toDate.plusDays(1).atStartOfDay();

        BigDecimal totalBooked = bookingRepository.sumRevenueByDateRange(from, to, REVENUE_STATUSES, ctx.ownerId());
        if (totalBooked == null) totalBooked = BigDecimal.ZERO;

        BigDecimal totalCash = paymentRepository.sumCashRevenueByDateRange(
                from, to, REVENUE_STATUSES, ctx.ownerId(), TransactionStatus.SUCCESS);
        if (totalCash == null) totalCash = BigDecimal.ZERO;

        Map<String, BigDecimal> bookedByPeriod = new TreeMap<>();
        for (Object[] row : bookingRepository.findRevenueEntriesByStartDate(
                from, to, REVENUE_STATUSES, ctx.ownerId())) {
            LocalDateTime start = (LocalDateTime) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            String key = buildPeriodKey(start.toLocalDate(), g);
            bookedByPeriod.merge(key, amount, BigDecimal::add);
        }

        Map<String, BigDecimal> cashByPeriod = new TreeMap<>();
        for (Object[] row : paymentRepository.findCashRevenueEntriesByBookingStartDate(
                from, to, REVENUE_STATUSES, ctx.ownerId(), TransactionStatus.SUCCESS)) {
            LocalDateTime start = (LocalDateTime) row[0];
            BigDecimal amount = (BigDecimal) row[1];
            String key = buildPeriodKey(start.toLocalDate(), g);
            cashByPeriod.merge(key, amount, BigDecimal::add);
        }

        Set<String> allPeriods = new TreeSet<>();
        allPeriods.addAll(bookedByPeriod.keySet());
        allPeriods.addAll(cashByPeriod.keySet());

        List<RevenueReportResponse.RevenuePeriodItem> breakdown = allPeriods.stream()
                .map(label -> {
                    BigDecimal booked = bookedByPeriod.getOrDefault(label, BigDecimal.ZERO);
                    BigDecimal cash = cashByPeriod.getOrDefault(label, BigDecimal.ZERO);
                    return RevenueReportResponse.RevenuePeriodItem.builder()
                            .periodLabel(label)
                            .totalRevenue(booked) // keep FE compatibility
                            .bookedRevenue(booked)
                            .cashCollected(cash)
                            .build();
                })
                .toList();

        return RevenueReportResponse.builder()
                .periodFrom(fromDate)
                .periodTo(toDate)
                .granularity(g)
                .totalRevenue(totalBooked) // keep FE compatibility
                .totalBookedRevenue(totalBooked)
                .totalCashCollected(totalCash)
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

    @Transactional
    public void seedDemoRevenueData() {
        // Admin-only utility for local testing
        UserEntity admin = getCurrentUser();
        if (admin.getRoleId() != UserRole.ADMIN) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        // Pick up to 3 owners with vehicles
        List<UserEntity> owners = userRepository.findByRoleId(UserRole.CAR_OWNER);
        if (owners.isEmpty()) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        LocalDateTime now = LocalDate.now().atStartOfDay();
        int createdCount = 0;

        for (UserEntity owner : owners) {
            if (createdCount >= 3) break;
            var vehicles = vehicleRepository.findByOwner_Id(owner.getId());
            if (vehicles.isEmpty()) {
                continue;
            }
            VehicleEntity vehicle = vehicles.getFirst();

            // Use admin as dummy customer for demo bookings
            UserEntity customer = admin;

            for (int i = 0; i < 2 && createdCount < 6; i++) {
                LocalDateTime start = now.minusDays(7L * (createdCount + 1));
                LocalDateTime end = start.plusDays(3);
                BigDecimal price = BigDecimal.valueOf(1_000_000L + (long) createdCount * 200_000L);

                BookingEntity booking = BookingEntity.builder()
                        .customer(customer)
                        .vehicle(vehicle)
                        .startDate(start)
                        .endDate(end)
                        .totalPrice(price)
                        .status(BookingStatus.COMPLETED)
                        .paymentStatus(com.example.car_management.entity.enums.PaymentStatus.FULLY_PAID)
                        .createdAt(Instant.now())
                        .updatedAt(Instant.now())
                        .build();

                booking = bookingRepository.save(booking);

                PaymentEntity payment = PaymentEntity.builder()
                        .booking(booking)
                        .paymentMethod(PaymentMethod.BANK_TRANSFER)
                        .paymentType(PaymentType.FULL_PAYMENT)
                        .amount(price)
                        .transactionId("DEMO-" + booking.getId())
                        .status(TransactionStatus.SUCCESS)
                        .paymentDate(Instant.now())
                        .build();

                paymentRepository.save(payment);
                createdCount++;
            }
        }

        if (createdCount == 0) {
            throw new AppException(ErrorCode.INVALID_KEY); // No owners with vehicles to seed
        }
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

    private String buildPeriodKey(LocalDate date, String granularity) {
        return switch (granularity) {
            case "DAILY" -> date.toString();
            case "QUARTERLY" -> date.getYear() + "-Q" + date.get(IsoFields.QUARTER_OF_YEAR);
            case "YEARLY" -> String.valueOf(date.getYear());
            default -> date.getYear() + "-" + String.format("%02d", date.getMonthValue());
        };
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
