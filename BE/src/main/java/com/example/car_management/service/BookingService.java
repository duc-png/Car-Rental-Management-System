package com.example.car_management.service;

import com.example.car_management.dto.request.CreateBookingRequest;
import com.example.car_management.dto.request.UpdateBookingStatusRequest;
import com.example.car_management.dto.response.BookingResponse;
import com.example.car_management.dto.response.BookedDateResponse;
import com.example.car_management.dto.response.OwnerBookingCalendarItemResponse;
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

        // 3. Check availability — block if vehicle already has a booking (even PENDING)
        // in the same period
        List<BookingStatus> activeStatuses = Arrays.asList(
                BookingStatus.PENDING,
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

        // 4. Calculate total price — round UP to nearest day (e.g. 34d 23h → 35 days)
        long hours = Duration.between(request.getStartDate(), request.getEndDate()).toHours();
        long days = (long) Math.ceil(hours / 24.0);
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
                .paymentStatus(PaymentStatus.UNPAID)
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
        return bookingMapper.toResponseList(bookings);
    }

    @Transactional(readOnly = true)
    public List<OwnerBookingCalendarItemResponse> getOwnerSuccessfulBookingCalendar(
            LocalDateTime from,
            LocalDateTime to,
            Integer vehicleId) {
        Integer userId = getCurrentUserId();

        if (vehicleId != null) {
            VehicleEntity vehicle = vehicleRepository.findById(vehicleId)
                    .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

            Integer ownerId = vehicle.getOwner() != null ? vehicle.getOwner().getId() : null;
            if (!userId.equals(ownerId)) {
                throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
            }
        }

        List<BookingStatus> successStatuses = Arrays.asList(
                BookingStatus.CONFIRMED,
                BookingStatus.ONGOING,
                BookingStatus.COMPLETED);

        List<BookingEntity> bookings = bookingRepository.findOwnerBookingsForCalendar(
                userId,
                vehicleId,
                from,
                to,
                successStatuses);

        return bookings.stream()
                .map(booking -> {
                    String brandName = booking.getVehicle() != null && booking.getVehicle().getModel() != null
                            && booking.getVehicle().getModel().getBrand() != null
                                    ? booking.getVehicle().getModel().getBrand().getName()
                                    : "";
                    String modelName = booking.getVehicle() != null && booking.getVehicle().getModel() != null
                            ? booking.getVehicle().getModel().getName()
                            : "";
                    String vehicleName = (brandName + " " + modelName).trim();

                    return OwnerBookingCalendarItemResponse.builder()
                            .bookingId(booking.getId())
                            .vehicleId(booking.getVehicle() != null ? booking.getVehicle().getId() : null)
                            .vehicleName(vehicleName.isEmpty() ? "Xe #" + booking.getVehicle().getId() : vehicleName)
                            .startDate(booking.getStartDate())
                            .endDate(booking.getEndDate())
                            .status(booking.getStatus())
                            .build();
                })
                .toList();
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

        // ===== Handle CONFIRMED: Generate PayOS Deposit Link (15%) =====
        if (request.getStatus() == BookingStatus.CONFIRMED &&
                booking.getPaymentStatus() == PaymentStatus.UNPAID) {

            try {
                // Calculate and set deposit amount (15%)
                BigDecimal depositAmount = booking.getTotalPrice().multiply(BigDecimal.valueOf(0.15));
                booking.setDepositAmount(depositAmount);

                var checkoutResponse = paymentService.createPaymentLink(booking, true);
                booking.setPaymentStatus(PaymentStatus.PENDING_DEPOSIT);
                booking.setCheckoutUrl(checkoutResponse.getCheckoutUrl());
                log.info("Deposit link created for booking #{}: {}", booking.getId(),
                        checkoutResponse.getCheckoutUrl());
            } catch (Exception e) {
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
                log.info("Auto-cancelling {} competing PENDING bookings for vehicle {}", competing.size(),
                        booking.getVehicle().getId());
                for (BookingEntity competitor : competing) {
                    competitor.setStatus(BookingStatus.CANCELLED);
                    competitor.setUpdatedAt(Instant.now());
                }
                bookingRepository.saveAll(competing);
            }
        }

        // ===== Handle ONGOING: Confirm Car Handover =====
        // 85% payment link was already created automatically after deposit was paid
        // (via webhook).
        // Owner can only start trip if customer has paid in full.
        if (request.getStatus() == BookingStatus.ONGOING) {
            if (booking.getPaymentStatus() != PaymentStatus.FULLY_PAID) {
                throw new AppException(ErrorCode.FULL_PAYMENT_NOT_COMPLETED);
            }
            log.info("Trip started for booking #{} — fully paid, car handed over.", booking.getId());
        }

        // ===== Handle COMPLETED: Return Car =====
        // Simple completion — no penalty calculations.
        if (request.getStatus() == BookingStatus.COMPLETED) {
            log.info("Trip completed for booking #{}.", booking.getId());
        }

        BookingEntity updated = bookingRepository.save(booking);
        return bookingMapper.toResponse(updated);
    }

    @Transactional
    public BookingResponse confirmHandover(Integer bookingId) {
        Integer userId = getCurrentUserId();
        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        // Only the customer (renter) can confirm handover
        Integer renterId = booking.getCustomer() != null ? booking.getCustomer().getId() : null;
        if (!userId.equals(renterId)) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        // Only allowed when booking is ONGOING
        if (booking.getStatus() != BookingStatus.ONGOING) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        booking.setCustomerConfirmedHandover(true);
        booking.setUpdatedAt(Instant.now());

        BookingEntity updated = bookingRepository.save(booking);
        log.info("Customer #{} confirmed handover for booking #{}", userId, bookingId);
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
        String name = authentication.getName();

        // Try email lookup first (normal JWT)
        java.util.Optional<UserEntity> byEmail = userRepository.findByEmail(name);
        if (byEmail.isPresent()) {
            return byEmail.get().getId();
        }

        // For OAuth2 JWT — extract email from token claims
        if (authentication instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwtAuth) {
            String emailClaim = jwtAuth.getToken().getClaimAsString("email");
            if (emailClaim != null) {
                return userRepository.findByEmail(emailClaim)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED))
                        .getId();
            }
        }

        throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }
}
