package com.example.car_management.service;

import com.example.car_management.dto.request.CreateBookingRequest;
import com.example.car_management.dto.request.UpdateBookingStatusRequest;
import com.example.car_management.dto.response.BookingResponse;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingService {

    BookingRepository bookingRepository;
    VehicleRepository vehicleRepository;
    UserRepository userRepository;
    BookingMapper bookingMapper;

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
        List<BookingStatus> activeStatuses = Arrays.asList(
                BookingStatus.CONFIRMED,
                BookingStatus.ONGOING);

        List<BookingEntity> conflicts = bookingRepository.findOverlappingBookings(
                request.getVehicleId(),
                request.getStartDate(),
                request.getEndDate(),
                activeStatuses);

        if (!conflicts.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_KEY);
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
                .createdAt(Instant.now())
                .build();

        BookingEntity saved = bookingRepository.save(booking);

        return bookingMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Integer bookingId) {
        Integer userId = getCurrentUserId();
        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));

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
    public List<BookingResponse> getUserBookings() {
        Integer userId = getCurrentUserId();
        List<BookingEntity> bookings = bookingRepository.findByRenterIdOrOwnerId(userId);
        return bookingMapper.toResponseList(bookings);
    }

    @Transactional
    public BookingResponse updateBookingStatus(Integer bookingId, UpdateBookingStatusRequest request) {
        Integer userId = getCurrentUserId();
        BookingEntity booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_KEY));

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
            throw new AppException(ErrorCode.INVALID_KEY);
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
