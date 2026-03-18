package com.example.car_management.service;

import com.example.car_management.dto.request.CreateIncidentReportAppealRequest;
import com.example.car_management.dto.request.CreateIncidentReportRequest;
import com.example.car_management.dto.request.IncidentReportDecisionRequest;
import com.example.car_management.dto.request.ReviewIncidentReportAppealRequest;
import com.example.car_management.dto.response.IncidentReportResponse;
import com.example.car_management.entity.BookingEntity;
import com.example.car_management.entity.IncidentReportEntity;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.entity.enums.IncidentReportAppealStatus;
import com.example.car_management.entity.enums.IncidentReportStatus;
import com.example.car_management.entity.enums.UserRole;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.repository.BookingRepository;
import com.example.car_management.repository.IncidentReportRepository;
import com.example.car_management.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class IncidentReportService {

    IncidentReportRepository incidentReportRepository;
    BookingRepository bookingRepository;
    UserRepository userRepository;

    @Transactional
    public IncidentReportResponse createReport(CreateIncidentReportRequest request) {
        UserEntity currentUser = getCurrentUser();
        if (currentUser.getRoleId() != UserRole.USER) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        BookingEntity booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        if (!booking.getCustomer().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        if (!isReportableBookingStatus(booking.getStatus())) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        Instant now = Instant.now();
        IncidentReportEntity report = IncidentReportEntity.builder()
                .booking(booking)
                .customer(currentUser)
                .owner(booking.getVehicle().getOwner())
                .category(request.getCategory())
                .description(request.getDescription().trim())
                .evidenceUrls(normalizeEvidenceList(request.getEvidenceUrls()))
                .status(IncidentReportStatus.PENDING)
                .appealStatus(IncidentReportAppealStatus.NONE)
                .createdAt(now)
                .updatedAt(now)
                .build();

        incidentReportRepository.save(report);
        return toResponse(report);
    }

    @Transactional(readOnly = true)
    public List<IncidentReportResponse> getMyReports() {
        UserEntity currentUser = getCurrentUser();
        if (currentUser.getRoleId() != UserRole.USER) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }
        return incidentReportRepository.findByCustomerIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IncidentReportResponse> getOwnerVisibleReports() {
        UserEntity currentUser = getCurrentUser();
        if (currentUser.getRoleId() != UserRole.CAR_OWNER) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        List<IncidentReportStatus> visibleStatuses = List.of(
                IncidentReportStatus.APPROVED,
                IncidentReportStatus.RESOLVED,
                IncidentReportStatus.PENALIZED,
                IncidentReportStatus.REFUNDED
        );

        return incidentReportRepository
                .findByOwnerIdAndStatusInOrderByCreatedAtDesc(currentUser.getId(), visibleStatuses)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IncidentReportResponse> getAllForAdmin() {
        UserEntity currentUser = getCurrentUser();
        ensureAdmin(currentUser);

        return incidentReportRepository.findAll().stream()
                .sorted(Comparator.comparing(IncidentReportEntity::getCreatedAt).reversed())
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public IncidentReportResponse decideReport(Integer reportId, IncidentReportDecisionRequest request) {
        UserEntity currentUser = getCurrentUser();
        ensureAdmin(currentUser);

        IncidentReportEntity report = incidentReportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.INCIDENT_REPORT_NOT_FOUND));

        IncidentReportStatus nextStatus = request.getStatus();
        if (nextStatus == null || nextStatus == IncidentReportStatus.PENDING) {
            throw new AppException(ErrorCode.INCIDENT_REPORT_INVALID_DECISION);
        }

        Instant now = Instant.now();
        report.setStatus(nextStatus);
        report.setDecisionNote(normalizeText(request.getDecisionNote(), 2000));
        report.setDecisionBy(currentUser);
        report.setDecisionAt(now);
        report.setUpdatedAt(now);

        incidentReportRepository.save(report);
        return toResponse(report);
    }

    @Transactional
    public IncidentReportResponse createAppeal(Integer reportId, CreateIncidentReportAppealRequest request) {
        UserEntity currentUser = getCurrentUser();
        if (currentUser.getRoleId() != UserRole.CAR_OWNER) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        IncidentReportEntity report = incidentReportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.INCIDENT_REPORT_NOT_FOUND));

        if (!report.getOwner().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        if (!isOwnerVisibleStatus(report.getStatus())) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        if (report.getAppealStatus() == IncidentReportAppealStatus.ACCEPTED) {
            throw new AppException(ErrorCode.INCIDENT_REPORT_APPEAL_NOT_ALLOWED);
        }

        if (report.getAppealStatus() == IncidentReportAppealStatus.PENDING) {
            throw new AppException(ErrorCode.INCIDENT_REPORT_APPEAL_NOT_ALLOWED);
        }

        Instant now = Instant.now();
        report.setAppealStatus(IncidentReportAppealStatus.PENDING);
        report.setAppealContent(request.getAppealContent().trim());
        report.setAppealEvidenceUrls(normalizeEvidenceList(request.getEvidenceUrls()));
        report.setAppealDecisionNote(null);
        report.setAppealDecisionAt(null);
        report.setAppealDecisionBy(null);
        report.setUpdatedAt(now);

        incidentReportRepository.save(report);
        return toResponse(report);
    }

    @Transactional
    public IncidentReportResponse reviewAppeal(Integer reportId, ReviewIncidentReportAppealRequest request) {
        UserEntity currentUser = getCurrentUser();
        ensureAdmin(currentUser);

        IncidentReportEntity report = incidentReportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(ErrorCode.INCIDENT_REPORT_NOT_FOUND));

        if (report.getAppealStatus() != IncidentReportAppealStatus.PENDING) {
            throw new AppException(ErrorCode.INCIDENT_REPORT_APPEAL_NOT_PENDING);
        }

        Instant now = Instant.now();
        boolean approve = Boolean.TRUE.equals(request.getApprove());
        if (approve) {
            IncidentReportStatus updatedStatus = request.getUpdatedStatus() != null
                    ? request.getUpdatedStatus()
                    : IncidentReportStatus.RESOLVED;
            if (updatedStatus == IncidentReportStatus.PENDING || updatedStatus == IncidentReportStatus.REJECTED) {
                throw new AppException(ErrorCode.INCIDENT_REPORT_INVALID_DECISION);
            }
            report.setStatus(updatedStatus);
            report.setAppealStatus(IncidentReportAppealStatus.ACCEPTED);
        } else {
            report.setAppealStatus(IncidentReportAppealStatus.REJECTED);
        }

        report.setAppealDecisionNote(normalizeText(request.getDecisionNote(), 2000));
        report.setAppealDecisionAt(now);
        report.setAppealDecisionBy(currentUser);
        report.setUpdatedAt(now);

        incidentReportRepository.save(report);
        return toResponse(report);
    }

    private IncidentReportResponse toResponse(IncidentReportEntity report) {
        BookingEntity booking = report.getBooking();
        String vehicleName = booking.getVehicle().getModel().getBrand().getName() + " "
                + booking.getVehicle().getModel().getName();
        return IncidentReportResponse.builder()
                .id(report.getId())
                .bookingId(booking.getId())
                .customerId(report.getCustomer().getId())
                .customerName(report.getCustomer().getFullName())
                .ownerId(report.getOwner().getId())
                .ownerName(report.getOwner().getFullName())
                .vehicleId(booking.getVehicle().getId())
                .vehicleName(vehicleName)
                .category(report.getCategory())
                .description(report.getDescription())
                .evidenceUrls(report.getEvidenceUrls())
                .status(report.getStatus())
                .decisionNote(report.getDecisionNote())
                .decisionAt(report.getDecisionAt())
                .appealStatus(report.getAppealStatus())
                .appealContent(report.getAppealContent())
                .appealEvidenceUrls(report.getAppealEvidenceUrls())
                .appealDecisionNote(report.getAppealDecisionNote())
                .appealDecisionAt(report.getAppealDecisionAt())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }

    private boolean isReportableBookingStatus(BookingStatus status) {
        if (status == null) return false;
        return status == BookingStatus.CONFIRMED
                || status == BookingStatus.ONGOING
                || status == BookingStatus.PENALTY_PAYMENT_PENDING
                || status == BookingStatus.COMPLETED;
    }

    private boolean isOwnerVisibleStatus(IncidentReportStatus status) {
        return status == IncidentReportStatus.APPROVED
                || status == IncidentReportStatus.RESOLVED
                || status == IncidentReportStatus.PENALIZED
                || status == IncidentReportStatus.REFUNDED;
    }

    private List<String> normalizeEvidenceList(List<String> items) {
        if (items == null || items.isEmpty()) {
            return new ArrayList<>();
        }
        return new ArrayList<>(items.stream()
                .map(value -> String.valueOf(value == null ? "" : value).trim())
                .filter(value -> !value.isEmpty())
                .limit(10)
                .toList());
    }

    private String normalizeText(String value, int maxLength) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return null;
        return trimmed.substring(0, Math.min(trimmed.length(), maxLength));
    }

    private void ensureAdmin(UserEntity user) {
        if (user.getRoleId() != UserRole.ADMIN) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }
    }

    private UserEntity getCurrentUser() {
        String email = String.valueOf(SecurityContextHolder.getContext().getAuthentication().getName())
                .trim()
                .toLowerCase(Locale.ROOT);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
