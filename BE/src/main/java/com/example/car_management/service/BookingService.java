package com.example.car_management.service;

import com.example.car_management.dto.request.CreateBookingRequest;
import com.example.car_management.dto.request.UpdateBookingStatusRequest;
import com.example.car_management.dto.response.BookingResponse;
import com.example.car_management.dto.response.BookedDateResponse;
import com.example.car_management.entity.BookingEntity;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.mapper.BookingMapper;
import com.example.car_management.repository.BookingRepository;
import com.example.car_management.repository.UserRepository;
import com.example.car_management.repository.VehicleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.car_management.entity.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingService {

    BookingRepository bookingRepository;
    VehicleRepository vehicleRepository;
    UserRepository userRepository;
    BookingMapper bookingMapper;
    PaymentService paymentService;

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        Integer renterId = getCurrentUserId();

        // 1. Get vehicle
        VehicleEntity vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

        // 2. Get customer
        UserEntity customer = userRepository.findById(renterId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 3. Check availability
        // PENDING bookings must also block overlapping dates
        // Only CONFIRMED/ONGOING block dates — multiple PENDING allowed (owner picks
        // one)
        List<BookingStatus> activeStatuses = Arrays.asList(
                BookingStatus.CONFIRMED,
                BookingStatus.ONGOING);

        List<BookingEntity> conflicts = bookingRepository.findOverlappingBookings(
                request.getVehicleId(),
                request.getStartDate(),
                request.getEndDate(),
                activeStatuses);

        if (!conflicts.isEmpty()) {
            throw new AppException(ErrorCode.BOOKING_DATE_CONFLICT);
        }

        // 4. Calculate total price
        long days = Duration.between(request.getStartDate(), request.getEndDate()).toDays();
        if (days == 0)
            days = 1;
        BigDecimal totalPrice = vehicle.getPricePerDay().multiply(BigDecimal.valueOf(days));

        // 5. Create booking
        BookingEntity booking = BookingEntity.builder()
                .vehicle(vehicle)
                .customer(customer)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalPrice(totalPrice)
                .status(BookingStatus.PENDING)
                .paymentStatus(com.example.car_management.entity.enums.PaymentStatus.UNPAID)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        BookingEntity saved = bookingRepository.save(booking);

        return bookingMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Integer bookingId) {
        Integer userId = getCurrentUserId();
        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        // Check permission
        Integer renterId = booking.getCustomer() != null ? booking.getCustomer().getId() : null;
        Integer ownerId = booking.getVehicle() != null && booking.getVehicle().getOwner() != null
                ? booking.getVehicle().getOwner().getId()
                : null;

        if (!userId.equals(renterId) && !userId.equals(ownerId)) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        return bookingMapper.toResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookedDateResponse> getBookedDatesByVehicle(Integer vehicleId) {
        List<BookingStatus> activeStatuses = Arrays.asList(
                BookingStatus.CONFIRMED,
                BookingStatus.ONGOING);

        List<BookingEntity> bookings = bookingRepository.findByVehicleIdAndStatusInAndEndDateAfter(
                vehicleId,
                activeStatuses,
                LocalDateTime.now());

        return bookings.stream()
                .map(b -> BookedDateResponse.builder()
                        .startDate(b.getStartDate())
                        .endDate(b.getEndDate())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getUserBookings() {
        Integer userId = getCurrentUserId();
        log.info("=== getUserBookings called for userId: {} ===", userId);
        List<BookingEntity> bookings = bookingRepository.findByRenterIdOrOwnerId(userId);
        log.info("=== Found {} bookings for userId: {} ===", bookings.size(), userId);
        for (BookingEntity b : bookings) {
            log.info("  Booking #{}: vehicle={}, customer={}, owner={}, status={}",
                    b.getId(),
                    b.getVehicle() != null ? b.getVehicle().getId() : "null",
                    b.getCustomer() != null ? b.getCustomer().getId() : "null",
                    b.getVehicle() != null && b.getVehicle().getOwner() != null ? b.getVehicle().getOwner().getId()
                            : "null",
                    b.getStatus());
        }
        return bookingMapper.toResponseList(bookings);
    }

    @Transactional
    public BookingResponse updateBookingStatus(Integer bookingId, UpdateBookingStatusRequest request) {
        Integer userId = getCurrentUserId();
        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        // Check permission: Owner (full access) OR Renter (cancel only)
        Integer ownerId = booking.getVehicle() != null && booking.getVehicle().getOwner() != null
                ? booking.getVehicle().getOwner().getId()
                : null;

        Integer renterId = booking.getCustomer() != null ? booking.getCustomer().getId() : null;

        if (userId.equals(ownerId)) {
            // Owner can update to any valid status
        } else if (userId.equals(renterId)) {
            // Renter can only CANCEL
            if (request.getStatus() != BookingStatus.CANCELLED) {
                throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
            }
        } else {
            // Stranger
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        // Validate status transition
        validateStatusTransition(booking.getStatus(), request.getStatus());

        booking.setStatus(request.getStatus());
        booking.setUpdatedAt(Instant.now());

        // ===== Handle CONFIRMED: Generate PayOS Deposit Link =====
        if (request.getStatus() == BookingStatus.CONFIRMED &&
                booking.getPaymentStatus() == PaymentStatus.UNPAID) {

            try {
                // Calculate and set deposit amount (15%)
                BigDecimal depositAmount = booking.getTotalPrice().multiply(BigDecimal.valueOf(0.15));
                booking.setDepositAmount(depositAmount);

                var checkoutResponse = paymentService.createPaymentLink(booking, true);
                booking.setPaymentStatus(PaymentStatus.PENDING_DEPOSIT);
                booking.setCheckoutUrl(checkoutResponse.getCheckoutUrl());
                log.info("Checkout URL: {}", checkoutResponse.getCheckoutUrl());
            } catch (Exception e) {
                // Throw so @Transactional rolls back — booking stays PENDING, not stuck
                // CONFIRMED
                log.error("Failed to create PayOS deposit link for booking #{}: {}", booking.getId(), e.getMessage());
                throw new AppException(ErrorCode.PAYMENT_ERROR);
            }

            // Auto-cancel all competing PENDING bookings for the same vehicle/dates
            List<BookingEntity> competing = bookingRepository.findCompetingPendingBookings(
                    booking.getVehicle().getId(),
                    booking.getId(),
                    booking.getStartDate(),
                    booking.getEndDate());
            if (!competing.isEmpty()) {
                log.info("Auto-cancelling {} competing PENDING bookings for vehicle {} (booking #{} confirmed)",
                        competing.size(), booking.getVehicle().getId(), booking.getId());
                for (BookingEntity competitor : competing) {
                    competitor.setStatus(BookingStatus.CANCELLED);
                    competitor.setUpdatedAt(Instant.now());
                }
                bookingRepository.saveAll(competing);
            }
        }

        // ===== Handle ONGOING: Start Trip - Record handover ODO & Fuel =====
        if (request.getStatus() == BookingStatus.ONGOING) {
            // Check that deposit has been paid before allowing start
            if (booking.getPaymentStatus() != PaymentStatus.DEPOSIT_PAID
                    && booking.getPaymentStatus() != PaymentStatus.FULLY_PAID) {
                throw new AppException(ErrorCode.DEPOSIT_NOT_PAID);
            }

            // Save start KM (default from vehicle if not provided)
            Integer startKm = request.getStartKm() != null
                    ? request.getStartKm()
                    : booking.getVehicle().getCurrentKm();
            booking.setStartKm(startKm);

            // Save start Fuel Level (default from vehicle if not provided)
            Integer startFuel = request.getStartFuelLevel() != null
                    ? request.getStartFuelLevel()
                    : (booking.getVehicle().getFuelLevel() != null ? booking.getVehicle().getFuelLevel() : 100);
            booking.setStartFuelLevel(startFuel);

            log.info("Start Trip - Booking #{}: startKm={}, startFuelLevel={}%", booking.getId(), startKm, startFuel);

            // Generate Full Payment Link (PayOS)
            if (booking.getPaymentStatus() == PaymentStatus.DEPOSIT_PAID) {
                try {
                    var checkoutResponse = paymentService.createPaymentLink(booking,
                            false);
                    booking.setPaymentStatus(PaymentStatus.PENDING_FULL_PAYMENT);
                    booking.setCheckoutUrl(checkoutResponse.getCheckoutUrl());
                    log.info("Checkout URL for Full Payment: {}", checkoutResponse.getCheckoutUrl());
                } catch (Exception e) {
                    log.warn("Could not create PayOS full payment link: {}", e.getMessage());
                }
            }
        }

        // ===== Handle COMPLETED: Return Car - Calculate surcharges =====
        if (request.getStatus() == BookingStatus.COMPLETED) {
            // Check that full payment has been completed
            if (booking.getPaymentStatus() != PaymentStatus.FULLY_PAID) {
                throw new AppException(ErrorCode.FULL_PAYMENT_NOT_COMPLETED);
            }

            // Save end KM
            if (request.getEndKm() != null) {
                booking.setEndKm(request.getEndKm());
            }
            // Save end Fuel Level
            if (request.getEndFuelLevel() != null) {
                booking.setEndFuelLevel(request.getEndFuelLevel());
            }
            // Save return notes
            if (request.getReturnNotes() != null) {
                booking.setReturnNotes(request.getReturnNotes());
            }

            // Calculate over-KM surcharge: 300km/day limit, 5000 VND per extra km
            BigDecimal overKmSurcharge = BigDecimal.ZERO;
            if (booking.getStartKm() != null && booking.getEndKm() != null) {
                int drivenKm = booking.getEndKm() - booking.getStartKm();
                long rentalDays = Duration
                        .between(booking.getStartDate().atZone(java.time.ZoneId.systemDefault()).toInstant(),
                                booking.getEndDate().atZone(java.time.ZoneId.systemDefault()).toInstant())
                        .toDays();
                if (rentalDays < 1)
                    rentalDays = 1;

                int allowedKm = (int) (rentalDays * 300);
                int overKm = drivenKm - allowedKm;

                if (overKm > 0) {
                    overKmSurcharge = BigDecimal.valueOf(overKm).multiply(BigDecimal.valueOf(5000));
                    log.info("Over-KM surcharge: {} km over limit ({} km allowed for {} days) = {} VND",
                            overKm, allowedKm, rentalDays, overKmSurcharge);
                }
            }

            // Calculate late return surcharge
            // - Under 24h late: 10% of pricePerDay per hour
            // - 24h or more: 150% of pricePerDay per full day
            BigDecimal lateReturnSurcharge = BigDecimal.ZERO;
            LocalDateTime actualReturn = request.getActualReturnTime() != null
                    ? request.getActualReturnTime()
                    : LocalDateTime.now();
            if (actualReturn.isAfter(booking.getEndDate())) {
                long lateMinutes = Duration.between(booking.getEndDate(), actualReturn).toMinutes();
                long lateHours = (lateMinutes + 59) / 60; // round up to nearest hour

                BigDecimal pricePerDay = booking.getVehicle().getPricePerDay();

                if (lateHours < 24) {
                    // Per hour penalty: 10% of daily rate per hour
                    lateReturnSurcharge = pricePerDay
                            .multiply(BigDecimal.valueOf(0.10))
                            .multiply(BigDecimal.valueOf(lateHours));
                    log.info("Late return: {} hours → surcharge = {} VND (10%/hour × {} hours)",
                            lateHours, lateReturnSurcharge, lateHours);
                } else {
                    // Per day penalty: 150% of daily rate per full day
                    long lateDays = (lateHours + 23) / 24; // round up to nearest day
                    lateReturnSurcharge = pricePerDay
                            .multiply(BigDecimal.valueOf(1.50))
                            .multiply(BigDecimal.valueOf(lateDays));
                    log.info("Late return: {} days → surcharge = {} VND (150%/day × {} days)",
                            lateDays, lateReturnSurcharge, lateDays);
                }
            }

            // Total surcharge = over-KM + late return + other surcharges from owner
            BigDecimal otherSurcharge = request.getOtherSurcharge() != null ? request.getOtherSurcharge()
                    : BigDecimal.ZERO;
            booking.setSurchargeAmount(overKmSurcharge.add(lateReturnSurcharge).add(otherSurcharge));
            log.info("Total surcharge for Booking #{}: {} VND (overKm={}, lateReturn={}, other={})",
                    booking.getId(), booking.getSurchargeAmount(), overKmSurcharge, lateReturnSurcharge,
                    otherSurcharge);

            // Update vehicle's current KM and fuel level for next rental
            VehicleEntity vehicle = booking.getVehicle();
            if (request.getEndKm() != null) {
                vehicle.setCurrentKm(request.getEndKm());
            }
            if (request.getEndFuelLevel() != null) {
                vehicle.setFuelLevel(request.getEndFuelLevel());
            }
        }

        BookingEntity updated = bookingRepository.save(booking);
        return bookingMapper.toResponse(updated);
    }

    private void validateStatusTransition(BookingStatus currentStatus, BookingStatus newStatus) {
        boolean isValid = false;

        switch (currentStatus) {
            case PENDING:
                isValid = (newStatus == BookingStatus.CONFIRMED || newStatus == BookingStatus.CANCELLED);
                break;
            case CONFIRMED:
                isValid = (newStatus == BookingStatus.ONGOING || newStatus == BookingStatus.CANCELLED);
                break;
            case ONGOING:
                isValid = (newStatus == BookingStatus.COMPLETED);
                break;
            case COMPLETED:
            case CANCELLED:
                isValid = false;
                break;
        }

        if (!isValid) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
    }

    private Integer getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return user.getId();
    }
}
