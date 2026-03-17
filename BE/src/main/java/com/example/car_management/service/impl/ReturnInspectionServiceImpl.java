package com.example.car_management.service.impl;

import com.example.car_management.dto.request.ReturnInspectionRequest;
import com.example.car_management.dto.response.ReturnInspectionResponse;
import com.example.car_management.entity.BookingEntity;
import com.example.car_management.entity.ReturnInspectionEntity;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.entity.enums.FuelLevel;
import com.example.car_management.entity.enums.ReturnStatus;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.repository.BookingRepository;
import com.example.car_management.repository.ReturnInspectionRepository;
import com.example.car_management.repository.UserRepository;
import com.example.car_management.service.PaymentService;
import com.example.car_management.service.ReturnInspectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeParseException;
import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReturnInspectionServiceImpl implements ReturnInspectionService {

    private final BookingRepository bookingRepository;
    private final ReturnInspectionRepository returnInspectionRepository;
    private final UserRepository userRepository;
    private final PaymentService paymentService;

    private static final BigDecimal LATE_FEE_PER_HOUR = BigDecimal.valueOf(50_000);
    private static final BigDecimal FUEL_FEE_PER_PERCENT = BigDecimal.valueOf(5_000);
    private static final int DEFAULT_INCLUDED_KM_PER_DAY = 200;
    private static final BigDecimal DEFAULT_OVER_KM_FEE_PER_KM = BigDecimal.valueOf(5_000);

    @Override
    @Transactional
    public ReturnInspectionResponse submitInspection(Integer bookingId, ReturnInspectionRequest request) {
        Integer currentUserId = getCurrentUserId();

        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        VehicleEntity vehicle = booking.getVehicle();
        if (vehicle == null || vehicle.getOwner() == null || !vehicle.getOwner().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        if (booking.getStatus() != BookingStatus.ONGOING) {
            throw new AppException(ErrorCode.BOOKING_NOT_ONGOING);
        }

        if (returnInspectionRepository.existsByBookingId(bookingId)) {
            throw new AppException(ErrorCode.BOOKING_ALREADY_INSPECTED);
        }

        LocalDateTime actualReturnDate = parseDateTime(request.getActualReturnDate());
        LocalDateTime scheduledEndDate = booking.getEndDate();

        if (request.getOdometerStart() == null || request.getOdometerEnd() == null) {
            throw new AppException(ErrorCode.INVALID_ODOMETER_READING);
        }

        int odometerStart = request.getOdometerStart();
        int odometerEnd = request.getOdometerEnd();
        if (odometerEnd < odometerStart) {
            throw new AppException(ErrorCode.INVALID_ODOMETER_READING);
        }

        int distanceTraveled = odometerEnd - odometerStart;
        int allowedKm = resolveAllowedKm(booking, request, distanceTraveled);
        int overKm = Math.max(0, distanceTraveled - allowedKm);
        BigDecimal overKmFee = calculateOverKmFee(overKm);
        String overKmBreakdown = buildOverKmFeeBreakdown(overKm, overKmFee);

        FuelLevel fuelStart = parseFuelLevel(request.getFuelLevelStart());
        FuelLevel fuelEnd = parseFuelLevel(request.getFuelLevelEnd());

        long lateHours = calculateLateHours(scheduledEndDate, actualReturnDate);
        BigDecimal lateFee = calculateLateFee(lateHours);
        String lateBreakdown = buildLateFeeBreakdown(lateHours, lateFee);

        int fuelDiffPercent = Math.max(0, FuelLevel.getDifference(fuelStart, fuelEnd));
        BigDecimal fuelFee = calculateFuelFee(fuelDiffPercent);
        String fuelBreakdown = buildFuelFeeBreakdown(fuelDiffPercent, fuelFee);

        BigDecimal damageFee = BigDecimal.valueOf(request.getDamageFee() != null ? request.getDamageFee() : 0.0d)
                .setScale(0, RoundingMode.HALF_UP);

        BigDecimal totalAdditionalFees = lateFee.add(fuelFee).add(overKmFee).add(damageFee);
        BigDecimal originalPrice = booking.getTotalPrice() != null ? booking.getTotalPrice() : BigDecimal.ZERO;
        BigDecimal finalTotal = originalPrice.add(totalAdditionalFees);

        ReturnInspectionEntity entity = ReturnInspectionEntity.builder()
                .booking(booking)
                .scheduledEndDate(scheduledEndDate)
                .actualReturnDate(actualReturnDate)
                .odometerStart(odometerStart)
                .odometerEnd(odometerEnd)
                .distanceTraveled(distanceTraveled)
                .allowedKm(allowedKm)
                .overKm(overKm)
                .overKmFee(overKmFee)
                .overKmFeeBreakdown(overKmBreakdown)
                .fuelLevelStart(fuelStart)
                .fuelLevelEnd(fuelEnd)
                .lateHours((int) lateHours)
                .lateFee(lateFee)
                .lateFeeBreakdown(lateBreakdown)
                .fuelFee(fuelFee)
                .fuelFeeBreakdown(fuelBreakdown)
                .damageDescription(request.getDamageDescription())
                .damageFee(damageFee)
                .totalAdditionalFees(totalAdditionalFees)
                .originalPrice(originalPrice)
                .finalTotal(finalTotal)
                .returnNotes(request.getReturnNotes())
                .build();

        returnInspectionRepository.save(entity);

        booking.setReturnStatus(ReturnStatus.FEES_CALCULATED);
        booking.setUpdatedAt(Instant.now());
        bookingRepository.save(booking);

        return toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnInspectionResponse getInspection(Integer bookingId) {
        Integer currentUserId = getCurrentUserId();

        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        Integer renterId = booking.getCustomer() != null ? booking.getCustomer().getId() : null;
        Integer ownerId = booking.getVehicle() != null && booking.getVehicle().getOwner() != null
                ? booking.getVehicle().getOwner().getId()
                : null;

        if (!currentUserId.equals(renterId) && !currentUserId.equals(ownerId)) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        ReturnInspectionEntity entity = returnInspectionRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_INSPECTED));

        return toResponse(entity);
    }

    @Override
    @Transactional
    public ReturnInspectionResponse confirmFees(Integer bookingId) {
        Integer currentUserId = getCurrentUserId();

        BookingEntity booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        Integer renterId = booking.getCustomer() != null ? booking.getCustomer().getId() : null;
        if (!currentUserId.equals(renterId)) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        if (booking.getStatus() != BookingStatus.ONGOING) {
            throw new AppException(ErrorCode.BOOKING_NOT_ONGOING);
        }

        ReturnInspectionEntity entity = returnInspectionRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_INSPECTED));

        BigDecimal additionalFees = entity.getTotalAdditionalFees() != null
                ? entity.getTotalAdditionalFees()
                : BigDecimal.ZERO;

        if (additionalFees.compareTo(BigDecimal.ZERO) > 0) {
            try {
                var checkoutResponse = paymentService.createPenaltyPaymentLink(booking, additionalFees);
                booking.setStatus(BookingStatus.PENALTY_PAYMENT_PENDING);
                booking.setReturnStatus(ReturnStatus.CUSTOMER_CONFIRMED);
                booking.setUpdatedAt(Instant.now());
                booking.setCheckoutUrl(checkoutResponse.getCheckoutUrl());
                bookingRepository.save(booking);
                log.info("Penalty payment link created for booking #{}: {}", booking.getId(),
                        checkoutResponse.getCheckoutUrl());
            } catch (Exception e) {
                log.error("Failed to create penalty payment link for booking #{}: {}", booking.getId(), e.getMessage());
                throw new AppException(ErrorCode.PAYMENT_ERROR);
            }
        } else {
            booking.setStatus(BookingStatus.COMPLETED);
            booking.setReturnStatus(ReturnStatus.CUSTOMER_CONFIRMED);
            booking.setUpdatedAt(Instant.now());
            // Không còn khoản phí nào phải thanh toán thêm => xoá mọi checkoutUrl còn sót
            booking.setCheckoutUrl(null);

            VehicleEntity vehicle = booking.getVehicle();
            if (vehicle != null) {
                vehicle.setCurrentKm(entity.getOdometerEnd());
                vehicle.setFuelLevel(entity.getFuelLevelEnd().getPercentage());
            }

            bookingRepository.save(booking);
        }

        return toResponse(entity);
    }

    private ReturnInspectionResponse toResponse(ReturnInspectionEntity entity) {
        BookingEntity booking = entity.getBooking();

        return ReturnInspectionResponse.builder()
                .bookingId(entity.getBooking().getId())
                .scheduledEndDate(entity.getScheduledEndDate())
                .actualReturnDate(entity.getActualReturnDate())
                .lateHours(entity.getLateHours())
                .lateFee(entity.getLateFee())
                .lateFeeBreakdown(entity.getLateFeeBreakdown())
                .distanceTraveled(entity.getDistanceTraveled())
                .allowedKm(entity.getAllowedKm())
                .overKm(entity.getOverKm())
                .overKmFee(entity.getOverKmFee())
                .overKmFeeBreakdown(entity.getOverKmFeeBreakdown())
                .fuelLevelStart(entity.getFuelLevelStart())
                .fuelLevelEnd(entity.getFuelLevelEnd())
                .fuelFee(entity.getFuelFee())
                .fuelFeeBreakdown(entity.getFuelFeeBreakdown())
                .damageDescription(entity.getDamageDescription())
                .damageFee(entity.getDamageFee())
                .damageImages(Collections.emptyList())
                .returnNotes(entity.getReturnNotes())
                .totalAdditionalFees(entity.getTotalAdditionalFees())
                .originalPrice(entity.getOriginalPrice())
                .finalTotal(entity.getFinalTotal())
                .penaltyCheckoutUrl(booking != null ? booking.getCheckoutUrl() : null)
                .build();
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException ex) {
            log.warn("Failed to parse actualReturnDate: {}", value, ex);
            throw new AppException(ErrorCode.INVALID_KEY);
        }
    }

    private FuelLevel parseFuelLevel(String value) {
        if (value == null) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
        try {
            return FuelLevel.valueOf(value);
        } catch (IllegalArgumentException ex) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
    }

    private long calculateLateHours(LocalDateTime scheduledEnd, LocalDateTime actualReturn) {
        if (actualReturn.isBefore(scheduledEnd) || actualReturn.isEqual(scheduledEnd)) {
            return 0;
        }
        Duration duration = Duration.between(scheduledEnd, actualReturn);
        long totalMinutes = duration.toMinutes();
        long hours = totalMinutes / 60;
        if (totalMinutes % 60 != 0) {
            hours += 1;
        }
        long chargeable = Math.max(0, hours - 1);
        return chargeable;
    }

    private BigDecimal calculateLateFee(long chargeableHours) {
        if (chargeableHours <= 0) {
            return BigDecimal.ZERO;
        }
        return LATE_FEE_PER_HOUR.multiply(BigDecimal.valueOf(chargeableHours));
    }

    private String buildLateFeeBreakdown(long chargeableHours, BigDecimal fee) {
        if (chargeableHours <= 0 || fee.compareTo(BigDecimal.ZERO) <= 0) {
            return "No late fee (within 1 hour grace period)";
        }
        return String.format("%d chargeable hours x 50,000đ/hour", chargeableHours);
    }

    private BigDecimal calculateFuelFee(int diffPercent) {
        if (diffPercent <= 0) {
            return BigDecimal.ZERO;
        }
        return FUEL_FEE_PER_PERCENT.multiply(BigDecimal.valueOf(diffPercent));
    }

    private String buildFuelFeeBreakdown(int diffPercent, BigDecimal fee) {
        if (diffPercent <= 0 || fee.compareTo(BigDecimal.ZERO) <= 0) {
            return "No fuel fee (tank level unchanged or higher)";
        }
        return String.format("%d%% x 5,000đ/%%", diffPercent);
    }

    private int resolveAllowedKm(BookingEntity booking, ReturnInspectionRequest request, int distanceTraveled) {
        if (request.getAllowedKm() != null) {
            return Math.max(0, request.getAllowedKm());
        }
        long rentalDays = ChronoUnit.DAYS.between(booking.getStartDate(), booking.getEndDate());
        if (rentalDays <= 0) {
            rentalDays = 1;
        }
        int computedAllowedKm = Math.toIntExact(rentalDays * DEFAULT_INCLUDED_KM_PER_DAY);
        return Math.max(computedAllowedKm, distanceTraveled == 0 ? 0 : 1);
    }

    private BigDecimal calculateOverKmFee(int overKm) {
        if (overKm <= 0) {
            return BigDecimal.ZERO;
        }
        return DEFAULT_OVER_KM_FEE_PER_KM.multiply(BigDecimal.valueOf(overKm));
    }

    private String buildOverKmFeeBreakdown(int overKm, BigDecimal fee) {
        if (overKm <= 0 || fee.compareTo(BigDecimal.ZERO) <= 0) {
            return "No over-km fee (within allowed mileage)";
        }
        return String.format("%d km x 5,000đ/km", overKm);
    }

    private Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        String email = authentication.getName();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return user.getId();
    }
}

