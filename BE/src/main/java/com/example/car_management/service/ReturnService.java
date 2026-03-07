package com.example.car_management.service;

import com.example.car_management.dto.request.ReturnInspectionRequest;
import com.example.car_management.dto.response.ReturnInspectionResponse;
import com.example.car_management.entity.BookingEntity;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.entity.enums.FuelLevel;
import com.example.car_management.entity.enums.ReturnStatus;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.repository.BookingRepository;
import com.example.car_management.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReturnService {

    BookingRepository bookingRepository;
    UserRepository userRepository;

    private static final BigDecimal LATE_FEE_PER_HOUR = BigDecimal.valueOf(5.00);
    private static final BigDecimal FUEL_COST_PER_PERCENT = BigDecimal.valueOf(0.50);
    private static final int GRACE_PERIOD_HOURS = 1;

    @Transactional
    public ReturnInspectionResponse submitReturnInspection(Integer bookingId, ReturnInspectionRequest request) {
        Integer userId = getCurrentUserId();
        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        Integer ownerId = booking.getVehicle().getOwner().getId();
        if (!userId.equals(ownerId)) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        if (booking.getStatus() != BookingStatus.ONGOING) {
            throw new AppException(ErrorCode.BOOKING_NOT_ONGOING);
        }

        if (booking.getReturnStatus() != ReturnStatus.NOT_RETURNED) {
            throw new AppException(ErrorCode.BOOKING_ALREADY_INSPECTED);
        }

        if (request.getOdometerEnd() < request.getOdometerStart()) {
            throw new AppException(ErrorCode.INVALID_ODOMETER_READING);
        }

        booking.setActualReturnDate(request.getActualReturnDate());
        booking.setOdometerStart(request.getOdometerStart());
        booking.setOdometerEnd(request.getOdometerEnd());
        booking.setFuelLevelStart(request.getFuelLevelStart());
        booking.setFuelLevelEnd(request.getFuelLevelEnd());
        booking.setDamageDescription(request.getDamageDescription());
        booking.setDamageImages(request.getDamageImages());
        booking.setReturnNotes(request.getReturnNotes());

        BigDecimal lateFee = calculateLateFee(booking.getEndDate(), request.getActualReturnDate());
        BigDecimal fuelFee = calculateFuelFee(request.getFuelLevelStart(), request.getFuelLevelEnd());
        BigDecimal damageFee = request.getDamageFee() != null ? request.getDamageFee() : BigDecimal.ZERO;

        booking.setLateFee(lateFee);
        booking.setFuelFee(fuelFee);
        booking.setDamageFee(damageFee);

        BigDecimal totalAdditional = lateFee.add(fuelFee).add(damageFee);
        booking.setTotalAdditionalFees(totalAdditional);
        booking.setReturnStatus(ReturnStatus.FEES_CALCULATED);
        booking.setUpdatedAt(Instant.now());

        bookingRepository.save(booking);

        return buildReturnInspectionResponse(booking);
    }

    @Transactional(readOnly = true)
    public ReturnInspectionResponse getReturnInspection(Integer bookingId) {
        Integer userId = getCurrentUserId();
        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        Integer renterId = booking.getCustomer().getId();
        Integer ownerId = booking.getVehicle().getOwner().getId();

        if (!userId.equals(renterId) && !userId.equals(ownerId)) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        return buildReturnInspectionResponse(booking);
    }

    @Transactional
    public ReturnInspectionResponse confirmReturnFees(Integer bookingId) {
        Integer userId = getCurrentUserId();
        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        Integer renterId = booking.getCustomer().getId();
        if (!userId.equals(renterId)) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        if (booking.getReturnStatus() != ReturnStatus.FEES_CALCULATED) {
            throw new AppException(ErrorCode.BOOKING_NOT_INSPECTED);
        }

        booking.setReturnStatus(ReturnStatus.CUSTOMER_CONFIRMED);
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setUpdatedAt(Instant.now());

        bookingRepository.save(booking);

        return buildReturnInspectionResponse(booking);
    }

    private BigDecimal calculateLateFee(LocalDateTime scheduledEnd, LocalDateTime actualReturn) {
        if (actualReturn == null || !actualReturn.isAfter(scheduledEnd)) {
            return BigDecimal.ZERO;
        }

        Duration lateDuration = Duration.between(scheduledEnd, actualReturn);
        long lateHours = lateDuration.toHours();

        if (lateHours <= GRACE_PERIOD_HOURS) {
            return BigDecimal.ZERO;
        }

        long chargeableHours = lateHours - GRACE_PERIOD_HOURS;
        return LATE_FEE_PER_HOUR.multiply(BigDecimal.valueOf(chargeableHours));
    }

    private BigDecimal calculateFuelFee(FuelLevel start, FuelLevel end) {
        if (start == null || end == null) {
            return BigDecimal.ZERO;
        }

        int fuelDifference = FuelLevel.getDifference(start, end);
        if (fuelDifference <= 0) {
            return BigDecimal.ZERO;
        }

        return FUEL_COST_PER_PERCENT.multiply(BigDecimal.valueOf(fuelDifference));
    }

    private ReturnInspectionResponse buildReturnInspectionResponse(BookingEntity booking) {
        long lateHours = 0;
        String lateFeeBreakdown = "No late fee";
        
        if (booking.getActualReturnDate() != null && booking.getActualReturnDate().isAfter(booking.getEndDate())) {
            Duration lateDuration = Duration.between(booking.getEndDate(), booking.getActualReturnDate());
            lateHours = lateDuration.toHours();
            if (lateHours > GRACE_PERIOD_HOURS) {
                lateFeeBreakdown = String.format("%d hours late (after %d hour grace period) × $%.2f/hour", 
                    lateHours - GRACE_PERIOD_HOURS, GRACE_PERIOD_HOURS, LATE_FEE_PER_HOUR);
            } else {
                lateFeeBreakdown = String.format("Within %d hour grace period", GRACE_PERIOD_HOURS);
            }
        }

        String fuelFeeBreakdown = "No fuel fee";
        if (booking.getFuelLevelStart() != null && booking.getFuelLevelEnd() != null) {
            int diff = FuelLevel.getDifference(booking.getFuelLevelStart(), booking.getFuelLevelEnd());
            if (diff > 0) {
                fuelFeeBreakdown = String.format("Fuel dropped %d%% (from %s to %s) × $%.2f/%%",
                    diff, booking.getFuelLevelStart().name(), booking.getFuelLevelEnd().name(), FUEL_COST_PER_PERCENT);
            } else {
                fuelFeeBreakdown = "Fuel returned at same or higher level";
            }
        }

        Integer distanceTraveled = null;
        if (booking.getOdometerStart() != null && booking.getOdometerEnd() != null) {
            distanceTraveled = booking.getOdometerEnd() - booking.getOdometerStart();
        }

        BigDecimal totalAdditional = booking.getTotalAdditionalFees() != null ? 
            booking.getTotalAdditionalFees() : BigDecimal.ZERO;
        BigDecimal finalTotal = booking.getTotalPrice().add(totalAdditional);

        return ReturnInspectionResponse.builder()
                .bookingId(booking.getId())
                .scheduledEndDate(booking.getEndDate())
                .actualReturnDate(booking.getActualReturnDate())
                .odometerStart(booking.getOdometerStart())
                .odometerEnd(booking.getOdometerEnd())
                .distanceTraveled(distanceTraveled)
                .fuelLevelStart(booking.getFuelLevelStart())
                .fuelLevelEnd(booking.getFuelLevelEnd())
                .damageDescription(booking.getDamageDescription())
                .damageImages(booking.getDamageImages())
                .lateFee(booking.getLateFee())
                .fuelFee(booking.getFuelFee())
                .damageFee(booking.getDamageFee())
                .totalAdditionalFees(totalAdditional)
                .originalPrice(booking.getTotalPrice())
                .finalTotal(finalTotal)
                .returnStatus(booking.getReturnStatus())
                .returnNotes(booking.getReturnNotes())
                .lateHours((int) lateHours)
                .lateFeeBreakdown(lateFeeBreakdown)
                .fuelFeeBreakdown(fuelFeeBreakdown)
                .build();
    }

    private Integer getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return user.getId();
    }
}
