package com.example.car_management.service;

import com.example.car_management.dto.request.CreateDisputeRequest;
import com.example.car_management.dto.request.ResolveDisputeRequest;
import com.example.car_management.dto.response.DisputeResponse;
import com.example.car_management.entity.BookingEntity;
import com.example.car_management.entity.DisputeEntity;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.enums.DisputeStatus;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.repository.BookingRepository;
import com.example.car_management.repository.DisputeRepository;
import com.example.car_management.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DisputeService {

    DisputeRepository disputeRepository;
    BookingRepository bookingRepository;
    UserRepository userRepository;

    @Transactional
    public DisputeResponse createDispute(CreateDisputeRequest request) {
        Integer userId = getCurrentUserId();

        BookingEntity booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        Integer renterId = booking.getCustomer().getId();
        if (!userId.equals(renterId)) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        // Dispute can be created when booking is in ONGOING or COMPLETED status
        if (booking.getStatus() != com.example.car_management.entity.enums.BookingStatus.ONGOING
                && booking.getStatus() != com.example.car_management.entity.enums.BookingStatus.COMPLETED) {
            throw new AppException(ErrorCode.CANNOT_CREATE_DISPUTE);
        }

        List<DisputeStatus> activeStatuses = Arrays.asList(DisputeStatus.OPEN, DisputeStatus.IN_DISCUSSION);
        List<DisputeEntity> existingDisputes = disputeRepository.findActiveDisputesByBookingId(
                request.getBookingId(), activeStatuses);

        if (!existingDisputes.isEmpty()) {
            throw new AppException(ErrorCode.DISPUTE_ALREADY_EXISTS);
        }

        UserEntity customer = booking.getCustomer();
        UserEntity owner = booking.getVehicle().getOwner();

        DisputeEntity dispute = DisputeEntity.builder()
                .booking(booking)
                .customer(customer)
                .owner(owner)
                .reason(request.getReason())
                .disputedAmount(request.getDisputedAmount() != null ? request.getDisputedAmount() : null)
                .status(DisputeStatus.OPEN)
                .createdAt(Instant.now())
                .build();

        disputeRepository.save(dispute);

        booking.setUpdatedAt(Instant.now());
        bookingRepository.save(booking);

        return toResponse(dispute);
    }

    @Transactional(readOnly = true)
    public DisputeResponse getDispute(Integer disputeId) {
        Integer userId = getCurrentUserId();

        DisputeEntity dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));

        if (!userId.equals(dispute.getCustomer().getId()) && !userId.equals(dispute.getOwner().getId())) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        return toResponse(dispute);
    }

    @Transactional(readOnly = true)
    public DisputeResponse getDisputeByBookingId(Integer bookingId) {
        Integer userId = getCurrentUserId();

        DisputeEntity dispute = disputeRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));

        if (!userId.equals(dispute.getCustomer().getId()) && !userId.equals(dispute.getOwner().getId())) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        return toResponse(dispute);
    }

    @Transactional(readOnly = true)
    public List<DisputeResponse> getMyDisputes() {
        Integer userId = getCurrentUserId();
        List<DisputeEntity> disputes = disputeRepository.findByUserId(userId);
        return disputes.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public DisputeResponse startDiscussion(Integer disputeId) {
        Integer userId = getCurrentUserId();

        DisputeEntity dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));

        if (!userId.equals(dispute.getCustomer().getId()) && !userId.equals(dispute.getOwner().getId())) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        if (dispute.getStatus() == DisputeStatus.RESOLVED || dispute.getStatus() == DisputeStatus.ESCALATED) {
            throw new AppException(ErrorCode.DISPUTE_ALREADY_RESOLVED);
        }

        dispute.setStatus(DisputeStatus.IN_DISCUSSION);
        dispute.setUpdatedAt(Instant.now());
        disputeRepository.save(dispute);

        return toResponse(dispute);
    }

    @Transactional
    public DisputeResponse resolveDispute(Integer disputeId, ResolveDisputeRequest request) {
        Integer userId = getCurrentUserId();

        DisputeEntity dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));

        if (!userId.equals(dispute.getOwner().getId())) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        if (dispute.getStatus() == DisputeStatus.RESOLVED) {
            throw new AppException(ErrorCode.DISPUTE_ALREADY_RESOLVED);
        }

        dispute.setFinalAmount(request.getFinalAmount());
        dispute.setResolutionNotes(request.getResolutionNotes());
        dispute.setStatus(DisputeStatus.RESOLVED);
        dispute.setResolvedAt(Instant.now());
        dispute.setUpdatedAt(Instant.now());
        disputeRepository.save(dispute);

        BookingEntity booking = dispute.getBooking();
        booking.setUpdatedAt(Instant.now());
        bookingRepository.save(booking);

        return toResponse(dispute);
    }

    @Transactional
    public DisputeResponse acceptResolution(Integer disputeId) {
        Integer userId = getCurrentUserId();

        DisputeEntity dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));

        if (!userId.equals(dispute.getCustomer().getId())) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        if (dispute.getStatus() != DisputeStatus.RESOLVED) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        BookingEntity booking = dispute.getBooking();
        booking.setStatus(com.example.car_management.entity.enums.BookingStatus.COMPLETED);
        booking.setUpdatedAt(Instant.now());
        bookingRepository.save(booking);

        return toResponse(dispute);
    }

    private DisputeResponse toResponse(DisputeEntity dispute) {
        BookingEntity booking = dispute.getBooking();
        String vehicleName = booking.getVehicle().getModel().getBrand().getName() + " " +
                booking.getVehicle().getModel().getName();

        return DisputeResponse.builder()
                .id(dispute.getId())
                .bookingId(booking.getId())
                .customerId(dispute.getCustomer().getId())
                .customerName(dispute.getCustomer().getFullName())
                .customerEmail(dispute.getCustomer().getEmail())
                .ownerId(dispute.getOwner().getId())
                .ownerName(dispute.getOwner().getFullName())
                .ownerEmail(dispute.getOwner().getEmail())
                .reason(dispute.getReason())
                .disputedAmount(dispute.getDisputedAmount())
                .status(dispute.getStatus())
                .resolutionNotes(dispute.getResolutionNotes())
                .finalAmount(dispute.getFinalAmount())
                .createdAt(dispute.getCreatedAt())
                .updatedAt(dispute.getUpdatedAt())
                .resolvedAt(dispute.getResolvedAt())
                .vehicleName(vehicleName)
                .originalFees(null)
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
