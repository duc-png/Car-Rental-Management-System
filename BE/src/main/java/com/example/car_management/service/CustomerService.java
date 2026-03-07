package com.example.car_management.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.MissingNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.car_management.dto.request.ChangePasswordRequest;
import com.example.car_management.dto.request.CreateCustomerRequest;
import com.example.car_management.dto.request.SendEmailOtpRequest;
import com.example.car_management.dto.request.UpdateMyBasicInfoRequest;
import com.example.car_management.dto.request.UpdateMyLicenseInfoRequest;
import com.example.car_management.dto.request.UpdateMyPhoneRequest;
import com.example.car_management.dto.request.UpdateCustomerLicenseVerificationRequest;
import com.example.car_management.dto.request.UpdateCustomerRequest;
import com.example.car_management.dto.request.UpdateCustomerStatusRequest;
import com.example.car_management.dto.request.VerifyEmailOtpRequest;
import com.example.car_management.dto.response.CustomerResponse;
import com.example.car_management.dto.response.LicenseOcrResponse;
import com.example.car_management.dto.response.VehicleResponse;
import com.example.car_management.entity.CustomerLicenseEntity;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.entity.enums.LicenseVerificationStatus;
import com.example.car_management.entity.enums.UserRole;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.mapper.VehicleMapper;
import com.example.car_management.repository.BookingRepository;
import com.example.car_management.repository.CustomerLicenseRepository;
import com.example.car_management.repository.CustomerBookingSummary;
import com.example.car_management.repository.UserRepository;
import com.example.car_management.repository.VehicleImageRepository;
import com.example.car_management.repository.VehicleRepository;
import com.example.car_management.service.cloud.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private static final Pattern OCR_DATE_PATTERN = Pattern
            .compile("\\b(?:\\d{1,2}[/.-]\\d{1,2}[/.-]\\d{2,4}|\\d{4}[/.-]\\d{1,2}[/.-]\\d{1,2})\\b");

    private final UserRepository userRepository;
    private final CustomerLicenseRepository customerLicenseRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;
    private final VehicleRepository vehicleRepository;
    private final VehicleImageRepository vehicleImageRepository;
    private final CloudinaryService cloudinaryService;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:no-reply@carrental.local}")
    private String fromEmail;

    @Value("${fpt.vision.dlr.api-key:}")
    private String fptVisionApiKey;

    @Value("${fpt.vision.dlr.url:https://api.fpt.ai/vision/dlr/vnm}")
    private String fptVisionDlrUrl;

    private final Map<Integer, EmailOtpSession> emailOtpSessions = new ConcurrentHashMap<>();
    private static final long EMAIL_OTP_EXPIRE_SECONDS = 300;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<CustomerResponse> listCustomers(String query) {
        List<UserEntity> customers = userRepository.searchCustomers(query, UserRole.USER);
        if (customers.isEmpty()) {
            return List.of();
        }

        List<Integer> ids = customers.stream()
                .map(UserEntity::getId)
                .toList();

        Map<Integer, CustomerBookingSummary> summaryMap = bookingRepository.summarizeByCustomerIds(ids)
                .stream()
                .collect(Collectors.toMap(CustomerBookingSummary::getCustomerId, item -> item));

        Map<Integer, CustomerLicenseEntity> licenseMap = customerLicenseRepository.findByUserIdIn(ids)
                .stream()
                .collect(Collectors.toMap(CustomerLicenseEntity::getUserId, item -> item));

        return customers.stream()
                .map(customer -> toResponse(customer, summaryMap.get(customer.getId()),
                        licenseMap.get(customer.getId())))
                .toList();
    }

    public CustomerResponse createCustomer(CreateCustomerRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        String rawPassword = request.getPassword();
        if (rawPassword == null || rawPassword.isBlank()) {
            rawPassword = generateTempPassword();
        }

        UserEntity user = UserEntity.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .avatar(request.getAvatar())
                .address(request.getAddress())
                .password(passwordEncoder.encode(rawPassword))
                .roleId(UserRole.USER)
                .isVerified(Boolean.TRUE)
                .isActive(Boolean.TRUE)
                .createdAt(Instant.now())
                .build();

        UserEntity saved = userRepository.save(user);

        CustomerLicenseEntity license = upsertLicenseNumber(saved, request.getLicenseNumber());

        return toResponse(saved, null, license);
    }

    public CustomerResponse updateCustomer(Integer id, UpdateCustomerRequest request) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (!user.getEmail().equalsIgnoreCase(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setAvatar(request.getAvatar());
        user.setAddress(request.getAddress());

        UserEntity saved = userRepository.save(user);
        CustomerLicenseEntity license = upsertLicenseNumber(saved, request.getLicenseNumber());

        CustomerBookingSummary summary = bookingRepository.summarizeByCustomerIds(List.of(saved.getId()))
                .stream()
                .findFirst()
                .orElse(null);

        return toResponse(saved, summary, license);
    }

    public CustomerResponse updateStatus(Integer id, UpdateCustomerStatusRequest request) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }

        UserEntity saved = userRepository.save(user);

        CustomerBookingSummary summary = bookingRepository.summarizeByCustomerIds(List.of(saved.getId()))
                .stream()
                .findFirst()
                .orElse(null);

        return toResponse(saved, summary, getCustomerLicense(saved.getId()));
    }

    public CustomerResponse getMyProfile(Integer userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (user.getRoleId() != UserRole.USER) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        CustomerBookingSummary summary = bookingRepository.summarizeByCustomerIds(List.of(user.getId()))
                .stream()
                .findFirst()
                .orElse(null);

        return toResponse(user, summary, getCustomerLicense(user.getId()));
    }

    public CustomerResponse updateMyProfile(Integer userId, UpdateCustomerRequest request) {
        UserEntity user = getCustomerById(userId);

        if (!user.getEmail().equalsIgnoreCase(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setAvatar(request.getAvatar());
        user.setAddress(request.getAddress());

        UserEntity saved = userRepository.save(user);
        CustomerLicenseEntity license = upsertLicenseNumber(saved, request.getLicenseNumber());

        CustomerBookingSummary summary = bookingRepository.summarizeByCustomerIds(List.of(saved.getId()))
                .stream()
                .findFirst()
                .orElse(null);

        return toResponse(saved, summary, license);
    }

    public CustomerResponse updateMyBasicInfo(Integer userId, UpdateMyBasicInfoRequest request) {
        UserEntity user = getCustomerById(userId);
        user.setFullName(String.valueOf(request.getFullName() == null ? "" : request.getFullName()).trim());

        UserEntity saved = userRepository.save(user);

        CustomerBookingSummary summary = bookingRepository.summarizeByCustomerIds(List.of(saved.getId()))
                .stream()
                .findFirst()
                .orElse(null);

        return toResponse(saved, summary, getCustomerLicense(saved.getId()));
    }

    public CustomerResponse updateMyLicenseInfo(Integer userId, UpdateMyLicenseInfoRequest request) {
        UserEntity user = getCustomerById(userId);
        String licenseFullName = sanitizeToMax(request.getLicenseFullName(), 100);
        String licenseNumber = sanitizeToMax(request.getLicenseNumber(), 50);
        String licenseDob = sanitizeToMax(request.getBirthDate(), 20);
        String nation = sanitizeToMax(request.getNation(), 100);
        String address = sanitizeToMax(request.getAddress(), 255);
        String addressRaw = sanitizeToMax(request.getAddressRaw(), 255);
        String issueLocation = sanitizeToMax(request.getIssueLocation(), 150);
        String issueDate = sanitizeToMax(request.getIssueDate(), 20);
        String licenseClass = sanitizeToMax(request.getLicenseClass(), 30);
        String expiryDate = sanitizeToMax(request.getExpiryDate(), 20);
        String licenseImageUrl = sanitizeToMax(request.getLicenseImageUrl(), 500);

        validateLicenseNumberOwnership(user.getId(), licenseNumber);

        // Keep personal DOB and GPLX DOB in sync.
        String syncedBirthDate = normalizeDateToken(licenseDob);

        CustomerLicenseEntity license = getOrCreateCustomerLicense(user);
        license.setLicenseFullName(licenseFullName);
        license.setLicenseNumber(licenseNumber);
        license.setLicenseDob(syncedBirthDate);
        license.setNation(nation);
        license.setAddress(address);
        license.setAddressRaw(addressRaw);
        license.setIssueLocation(issueLocation);
        license.setIssueDate(issueDate);
        license.setLicenseClass(licenseClass);
        license.setExpiryDate(expiryDate);
        license.setLicenseImageUrl(licenseImageUrl);
        license.setVerificationStatus(LicenseVerificationStatus.PENDING);
        license.setVerificationNote(null);
        license.setVerifiedAt(null);
        CustomerLicenseEntity savedLicense = customerLicenseRepository.save(license);

        UserEntity saved = userRepository.save(user);

        CustomerBookingSummary summary = bookingRepository.summarizeByCustomerIds(List.of(saved.getId()))
                .stream()
                .findFirst()
                .orElse(null);

        return toResponse(saved, summary, savedLicense);
    }

    private String sanitizeToMax(String value, int maxLength) {
        String sanitized = String.valueOf(value == null ? "" : value).trim();
        if (sanitized.length() <= maxLength) {
            return sanitized;
        }
        return sanitized.substring(0, maxLength);
    }

    public CustomerResponse reviewCustomerLicenseVerification(Integer customerId,
            UpdateCustomerLicenseVerificationRequest request) {
        UserEntity user = userRepository.findById(customerId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (user.getRoleId() != UserRole.USER) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        LicenseVerificationStatus decision = request.getStatus();
        if (decision == null || decision == LicenseVerificationStatus.PENDING) {
            throw new AppException(ErrorCode.LICENSE_VERIFICATION_INVALID_STATUS);
        }

        CustomerLicenseEntity license = getCustomerLicense(user.getId());
        if (license == null) {
            throw new AppException(ErrorCode.LICENSE_VERIFICATION_NOT_PENDING);
        }

        LicenseVerificationStatus currentStatus = license.getVerificationStatus();

        if (currentStatus != LicenseVerificationStatus.PENDING) {
            throw new AppException(ErrorCode.LICENSE_VERIFICATION_NOT_PENDING);
        }

        if (decision == LicenseVerificationStatus.REJECTED
                && String.valueOf(request.getNote() == null ? "" : request.getNote()).trim().isEmpty()) {
            throw new AppException(ErrorCode.LICENSE_VERIFICATION_NOTE_REQUIRED);
        }

        license.setVerificationStatus(decision);
        if (decision == LicenseVerificationStatus.APPROVED) {
            license.setVerificationNote(String.valueOf(request.getNote() == null ? "" : request.getNote()).trim());
            license.setVerifiedAt(Instant.now());
        } else {
            license.setVerificationNote(String.valueOf(request.getNote() == null ? "" : request.getNote()).trim());
            license.setVerifiedAt(null);
        }

        CustomerLicenseEntity savedLicense = customerLicenseRepository.save(license);

        UserEntity saved = userRepository.save(user);

        CustomerBookingSummary summary = bookingRepository.summarizeByCustomerIds(List.of(saved.getId()))
                .stream()
                .findFirst()
                .orElse(null);

        return toResponse(saved, summary, savedLicense);
    }

    public LicenseOcrResponse scanMyLicenseWithOcr(Integer userId, MultipartFile file) {
        getCustomerById(userId);

        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.LICENSE_OCR_FAILED);
        }

        if (fptVisionApiKey == null || fptVisionApiKey.isBlank()) {
            throw new AppException(ErrorCode.LICENSE_OCR_NOT_CONFIGURED);
        }

        try {
            String boundary = "----FptDlrBoundary" + UUID.randomUUID().toString().replace("-", "");
            byte[] body = buildMultipartBody(boundary, file);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(fptVisionDlrUrl))
                    .header("api-key", fptVisionApiKey)
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new AppException(ErrorCode.LICENSE_OCR_FAILED);
            }

            JsonNode root = objectMapper.readTree(response.body());
            int errorCode = root.path("errorCode").asInt(-1);
            if (errorCode != 0) {
                throw new AppException(ErrorCode.LICENSE_OCR_FAILED);
            }

            JsonNode firstData = root.path("data").isArray() && root.path("data").size() > 0
                    ? root.path("data").get(0)
                    : null;

            if (firstData == null || firstData.isMissingNode()) {
                throw new AppException(ErrorCode.LICENSE_OCR_FAILED);
            }

            JsonNode recognitionGroup = resolveRecognitionGroup(firstData);
            String expiryDate = extractExpiryDate(firstData, recognitionGroup);
            String licenseImageUrl = cloudinaryService.uploadCustomerLicenseImage(file, userId);

            return LicenseOcrResponse.builder()
                    .licenseNumber(
                            normalizeOcrValue(extractFirstNonBlank(firstData, recognitionGroup,
                                    "id", "license_id", "license_number")))
                    .licenseFullName(normalizeOcrValue(extractFirstNonBlank(firstData, recognitionGroup,
                            "name", "full_name")))
                    .birthDate(normalizeDateToken(extractFirstNonBlank(firstData, recognitionGroup,
                            "dob", "date_of_birth", "birth_date")))
                    .nation(normalizeOcrValue(extractFirstNonBlank(firstData, recognitionGroup,
                            "nation", "nationality")))
                    .address(normalizeOcrValue(extractFirstNonBlank(firstData, recognitionGroup, "address")))
                    .addressRaw(normalizeOcrValue(extractAddressRaw(firstData)))
                    .issueLocation(normalizeOcrValue(extractFirstNonBlank(firstData, recognitionGroup,
                            "issue_location", "issue_place")))
                    .issueDate(normalizeDateToken(extractFirstNonBlank(firstData, recognitionGroup,
                            "issue_date", "date_of_issue")))
                    .licenseClass(normalizeOcrValue(extractFirstNonBlank(firstData, recognitionGroup,
                            "class", "license_class")))
                    .expiryDate(normalizeOcrValue(expiryDate))
                    .documentType(normalizeOcrValue(extractFirstNonBlank(firstData, recognitionGroup,
                            "type", "document_type")))
                    .licenseNumberConfidence(normalizeOcrValue(firstData.path("id_prob").asText("")))
                    .licenseFullNameConfidence(normalizeOcrValue(firstData.path("name_prob").asText("")))
                    .birthDateConfidence(normalizeOcrValue(firstData.path("dob_prob").asText("")))
                    .licenseImageUrl(licenseImageUrl)
                    .build();
        } catch (AppException appException) {
            throw appException;
        } catch (Exception exception) {
            throw new AppException(ErrorCode.LICENSE_OCR_FAILED);
        }
    }

    public List<VehicleResponse> listMyFavorites(Integer userId) {
        UserEntity user = getCustomerById(userId);

        return user.getFavoriteVehicles().stream()
                .sorted((a, b) -> Integer.compare(b.getId(), a.getId()))
                .map(vehicle -> VehicleMapper.toResponse(
                        vehicle,
                        vehicleImageRepository.findByVehicle_Id(vehicle.getId())))
                .toList();
    }

    public List<VehicleResponse> addFavorite(Integer userId, Integer vehicleId) {
        UserEntity user = getCustomerById(userId);
        VehicleEntity vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

        boolean exists = user.getFavoriteVehicles().stream()
                .anyMatch(item -> Objects.equals(item.getId(), vehicleId));

        if (!exists) {
            user.getFavoriteVehicles().add(vehicle);
            userRepository.save(user);
        }

        return listMyFavorites(userId);
    }

    public List<VehicleResponse> removeFavorite(Integer userId, Integer vehicleId) {
        UserEntity user = getCustomerById(userId);

        user.getFavoriteVehicles().removeIf(item -> Objects.equals(item.getId(), vehicleId));
        userRepository.save(user);

        return listMyFavorites(userId);
    }

    public void changeMyPassword(Integer userId, ChangePasswordRequest request) {
        UserEntity user = getCustomerById(userId);

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.OLD_PASSWORD_INCORRECT);
        }

        if (!Objects.equals(request.getNewPassword(), request.getConfirmPassword())) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRM_MISMATCH);
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.PASSWORD_EXISTED);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public void sendEmailOtpForProfileUpdate(Integer userId, SendEmailOtpRequest request) {
        UserEntity user = getCustomerById(userId);

        String newEmail = normalizeEmail(request.getNewEmail());
        if (newEmail.isBlank()) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        if (user.getEmail() != null && user.getEmail().equalsIgnoreCase(newEmail)) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        if (userRepository.existsByEmail(newEmail)) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
        Instant expireAt = Instant.now().plusSeconds(EMAIL_OTP_EXPIRE_SECONDS);

        emailOtpSessions.put(userId, new EmailOtpSession(newEmail, otp, expireAt));
        sendOtpEmail(newEmail, user.getFullName(), otp);
    }

    public CustomerResponse verifyEmailOtpForProfileUpdate(Integer userId, VerifyEmailOtpRequest request) {
        UserEntity user = getCustomerById(userId);

        EmailOtpSession session = emailOtpSessions.get(userId);
        if (session == null) {
            throw new AppException(ErrorCode.EMAIL_OTP_NOT_FOUND);
        }

        if (Instant.now().isAfter(session.expireAt())) {
            emailOtpSessions.remove(userId);
            throw new AppException(ErrorCode.EMAIL_OTP_EXPIRED);
        }

        String newEmail = normalizeEmail(request.getNewEmail());
        if (!session.email().equalsIgnoreCase(newEmail)) {
            throw new AppException(ErrorCode.EMAIL_OTP_INVALID);
        }

        String otp = String.valueOf(request.getOtp() == null ? "" : request.getOtp()).trim();
        if (!session.otp().equals(otp)) {
            throw new AppException(ErrorCode.EMAIL_OTP_INVALID);
        }

        if (userRepository.existsByEmail(newEmail)) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        user.setEmail(newEmail);
        UserEntity saved = userRepository.save(user);
        emailOtpSessions.remove(userId);

        CustomerBookingSummary summary = bookingRepository.summarizeByCustomerIds(List.of(saved.getId()))
                .stream()
                .findFirst()
                .orElse(null);

        return toResponse(saved, summary, getCustomerLicense(saved.getId()));
    }

    public CustomerResponse updateMyPhone(Integer userId, UpdateMyPhoneRequest request) {
        UserEntity user = getCustomerById(userId);
        user.setPhone(String.valueOf(request.getPhone() == null ? "" : request.getPhone()).trim());
        UserEntity saved = userRepository.save(user);

        CustomerBookingSummary summary = bookingRepository.summarizeByCustomerIds(List.of(saved.getId()))
                .stream()
                .findFirst()
                .orElse(null);

        return toResponse(saved, summary, getCustomerLicense(saved.getId()));
    }

    public String uploadMyAvatar(Integer userId, MultipartFile file) {
        UserEntity user = getCustomerById(userId);

        String avatarUrl = cloudinaryService.uploadCustomerAvatar(file, user.getId());
        user.setAvatar(avatarUrl);
        userRepository.save(user);

        return avatarUrl;
    }

    private UserEntity getCustomerById(Integer userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (user.getRoleId() != UserRole.USER) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return user;
    }

    private String normalizeEmail(String value) {
        return String.valueOf(value == null ? "" : value).trim().toLowerCase(Locale.ROOT);
    }

    private void sendOtpEmail(String toEmail, String fullName, String otp) {
        if (!mailEnabled) {
            throw new AppException(ErrorCode.EMAIL_OTP_SEND_FAILED);
        }

        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new AppException(ErrorCode.EMAIL_OTP_SEND_FAILED);
        }

        try {
            String displayName = (fullName == null || fullName.isBlank()) ? "Ban" : fullName.trim();

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("[CarRental] Ma OTP xac minh doi email");
            message.setText("Xin chao " + displayName + ",\n\n"
                    + "Ma OTP de doi email tai khoan cua ban la: " + otp + "\n"
                    + "Ma co hieu luc trong 5 phut.\n\n"
                    + "Neu ban khong thuc hien thao tac nay, vui long bo qua email.\n\n"
                    + "CarRental");

            mailSender.send(message);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.EMAIL_OTP_SEND_FAILED);
        }
    }

    private byte[] buildMultipartBody(String boundary, MultipartFile file) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        String fileName = String
                .valueOf(file.getOriginalFilename() == null ? "license.jpg" : file.getOriginalFilename()).trim();
        String contentType = String
                .valueOf(file.getContentType() == null ? "application/octet-stream" : file.getContentType()).trim();

        output.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Disposition: form-data; name=\"image\"; filename=\"" + fileName + "\"\r\n")
                .getBytes(StandardCharsets.UTF_8));
        output.write(("Content-Type: " + contentType + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        output.write(file.getBytes());
        output.write("\r\n".getBytes(StandardCharsets.UTF_8));
        output.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

        return output.toByteArray();
    }

    private String normalizeOcrValue(String value) {
        String normalized = String.valueOf(value == null ? "" : value).trim();
        if (normalized.equalsIgnoreCase("N/A") || normalized.equalsIgnoreCase("null")) {
            return "";
        }
        return normalized;
    }

    private record EmailOtpSession(String email, String otp, Instant expireAt) {
    }

    private CustomerResponse toResponse(UserEntity user, CustomerBookingSummary summary,
            CustomerLicenseEntity license) {
        Long totalBookings = summary != null ? summary.getTotalBookings() : 0L;
        BigDecimal totalRevenue = summary != null ? summary.getTotalRevenue() : BigDecimal.ZERO;

        String licenseNumber = license != null ? license.getLicenseNumber() : null;
        String licenseFullName = license != null ? license.getLicenseFullName() : null;
        String licenseDob = license != null ? normalizeDateToken(license.getLicenseDob()) : null;
        String nation = license != null ? license.getNation() : null;
        String licenseAddress = license != null ? license.getAddress() : null;
        String licenseAddressRaw = license != null ? license.getAddressRaw() : null;
        String issueLocation = license != null ? license.getIssueLocation() : null;
        String issueDate = license != null ? normalizeDateToken(license.getIssueDate()) : null;
        String licenseClass = license != null ? license.getLicenseClass() : null;
        String expiryDate = license != null ? normalizeDateToken(license.getExpiryDate()) : null;
        String licenseImageUrl = license != null ? license.getLicenseImageUrl() : null;
        LicenseVerificationStatus verificationStatus = license != null ? license.getVerificationStatus() : null;
        String verificationNote = license != null ? license.getVerificationNote() : null;
        Instant verifiedAt = license != null ? license.getVerifiedAt() : null;

        return CustomerResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .birthDate(licenseDob)
                .email(user.getEmail())
                .phone(user.getPhone())
                .licenseNumber(licenseNumber)
                .licenseFullName(licenseFullName)
                .licenseDob(licenseDob)
                .nation(nation)
                .licenseAddress(licenseAddress)
                .licenseAddressRaw(licenseAddressRaw)
                .issueLocation(issueLocation)
                .issueDate(issueDate)
                .licenseClass(licenseClass)
                .expiryDate(expiryDate)
                .licenseImageUrl(licenseImageUrl)
                .licenseVerificationStatus(verificationStatus)
                .licenseVerificationNote(verificationNote)
                .licenseVerifiedAt(verifiedAt)
                .avatar(user.getAvatar())
                .address(user.getAddress())
                .isActive(user.getIsActive() == null || user.getIsActive())
                .createdAt(user.getCreatedAt())
                .totalBookings(totalBookings)
                .totalRevenue(totalRevenue)
                .build();
    }

    private CustomerLicenseEntity getCustomerLicense(Integer userId) {
        return customerLicenseRepository.findByUserId(userId).orElse(null);
    }

    private CustomerLicenseEntity getOrCreateCustomerLicense(UserEntity user) {
        return customerLicenseRepository.findByUserId(user.getId())
                .orElseGet(() -> CustomerLicenseEntity.builder()
                        .userId(user.getId())
                        .build());
    }

    private CustomerLicenseEntity upsertLicenseNumber(UserEntity user, String maybeLicenseNumber) {
        String licenseNumber = String.valueOf(maybeLicenseNumber == null ? "" : maybeLicenseNumber).trim();
        if (licenseNumber.isEmpty()) {
            return getCustomerLicense(user.getId());
        }

        validateLicenseNumberOwnership(user.getId(), licenseNumber);

        CustomerLicenseEntity license = getOrCreateCustomerLicense(user);
        license.setLicenseNumber(licenseNumber);
        return customerLicenseRepository.save(license);
    }

    private void validateLicenseNumberOwnership(Integer currentUserId, String licenseNumber) {
        String normalized = String.valueOf(licenseNumber == null ? "" : licenseNumber).trim();
        if (normalized.isEmpty()) {
            return;
        }

        Optional<CustomerLicenseEntity> existing = customerLicenseRepository.findByLicenseNumber(normalized);
        if (existing.isPresent() && !Objects.equals(existing.get().getUserId(), currentUserId)) {
            throw new AppException(ErrorCode.LICENSE_NUMBER_EXISTED);
        }
    }

    private String extractFirstNonBlank(JsonNode node, String... keys) {
        return extractFirstNonBlank(node, MissingNode.getInstance(), keys);
    }

    private String extractFirstNonBlank(JsonNode node, JsonNode alternateNode, String... keys) {
        if (node == null || keys == null) {
            return "";
        }

        for (String key : keys) {
            String value = node.path(key).asText("");
            if (value != null && !value.isBlank()) {
                return value;
            }
        }

        if (alternateNode != null && !alternateNode.isMissingNode()) {
            for (String key : keys) {
                String value = alternateNode.path(key).asText("");
                if (value != null && !value.isBlank()) {
                    return value;
                }
            }
        }

        return "";
    }

    private JsonNode resolveRecognitionGroup(JsonNode node) {
        if (node == null || node.isMissingNode()) {
            return MissingNode.getInstance();
        }

        JsonNode recognitionGroup = node.path("RecognitionKeyGroup");
        if (!recognitionGroup.isMissingNode() && !recognitionGroup.isNull()) {
            return recognitionGroup;
        }

        JsonNode recognitionGroupLower = node.path("recognitionKeyGroup");
        if (!recognitionGroupLower.isMissingNode() && !recognitionGroupLower.isNull()) {
            return recognitionGroupLower;
        }

        return MissingNode.getInstance();
    }

    private String extractAddressRaw(JsonNode node) {
        if (node == null) {
            return "";
        }

        String value = node.path("address_raw").asText("");
        if (value != null && !value.isBlank()) {
            return value;
        }

        JsonNode recognitionGroup = resolveRecognitionGroup(node);
        value = recognitionGroup.path("address_raw").asText("");
        if (value != null && !value.isBlank()) {
            return value;
        }

        return "";
    }

    private String extractExpiryDate(JsonNode node, JsonNode alternateNode) {
        String directValue = extractFirstNonBlank(node, alternateNode,
                "date_of_expire", "expiry_date", "date_of_expiry", "date_of_expiration",
                "expiration_date", "expire_date", "expires");

        String keywordDate = extractDateFromExpiryKeywordText(node, alternateNode);
        if (!keywordDate.isBlank()) {
            return keywordDate;
        }

        String issueDateRaw = extractFirstNonBlank(node, alternateNode, "issue_date", "date_of_issue");
        LocalDate issueDate = parseFlexibleDate(issueDateRaw);
        String inferredDate = inferExpiryDateFromCandidates(node, alternateNode, issueDate);
        if (!inferredDate.isBlank()) {
            return inferredDate;
        }

        return normalizeDateToken(directValue);
    }

    private String inferExpiryDateFromCandidates(JsonNode node, JsonNode alternateNode, LocalDate issueDate) {
        Set<String> dateTokens = new LinkedHashSet<>();
        collectDateTokens(node, dateTokens);
        collectDateTokens(alternateNode, dateTokens);

        if (dateTokens.isEmpty()) {
            return "";
        }

        List<LocalDate> parsedDates = dateTokens.stream()
                .map(this::parseFlexibleDate)
                .filter(Objects::nonNull)
                .sorted()
                .toList();

        if (parsedDates.isEmpty()) {
            return "";
        }

        if (issueDate == null) {
            return formatDate(parsedDates.get(parsedDates.size() - 1));
        }

        LocalDate best = null;
        int bestScore = Integer.MAX_VALUE;
        for (LocalDate candidate : parsedDates) {
            if (!candidate.isAfter(issueDate)) {
                continue;
            }

            int yearsGap = candidate.getYear() - issueDate.getYear();
            if (yearsGap <= 0 || yearsGap > 20) {
                continue;
            }

            int monthDayPenalty = (candidate.getMonthValue() == issueDate.getMonthValue()
                    && candidate.getDayOfMonth() == issueDate.getDayOfMonth()) ? 0 : 50;
            int score = yearsGap * 10 + monthDayPenalty;

            if (best == null || score < bestScore) {
                best = candidate;
                bestScore = score;
            }
        }

        if (best == null) {
            return "";
        }

        return formatDate(best);
    }

    private void collectDateTokens(JsonNode node, Set<String> output) {
        if (node == null || node.isMissingNode() || node.isNull() || output == null) {
            return;
        }

        if (node.isValueNode()) {
            String token = extractDateToken(node.asText(""));
            if (!token.isBlank()) {
                output.add(normalizeDateToken(token));
            }
            return;
        }

        if (node.isArray()) {
            for (JsonNode child : node) {
                collectDateTokens(child, output);
            }
            return;
        }

        if (node.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                collectDateTokens(fields.next().getValue(), output);
            }
        }
    }

    private LocalDate parseFlexibleDate(String raw) {
        String token = String.valueOf(raw == null ? "" : raw).trim();
        if (token.isBlank()) {
            return null;
        }

        token = token.replace('.', '/').replace('-', '/');
        String[] parts = token.split("/");

        if (parts.length == 2 && parts[0].length() == 4 && parts[1].length() == 4) {
            try {
                String dayMonth = parts[0];
                int day = Integer.parseInt(dayMonth.substring(0, 2));
                int month = Integer.parseInt(dayMonth.substring(2, 4));
                int year = Integer.parseInt(parts[1]);
                return LocalDate.of(year, month, day);
            } catch (Exception ignored) {
                return null;
            }
        }

        if (parts.length != 3) {
            return null;
        }

        try {
            int first = Integer.parseInt(parts[0]);
            int second = Integer.parseInt(parts[1]);
            int third = Integer.parseInt(parts[2]);

            int day;
            int month;
            int year;

            if (parts[0].length() == 4) {
                year = first;
                month = second;
                day = third;
            } else {
                day = first;
                month = second;
                year = third;
            }

            if (year < 100) {
                year += 2000;
            }

            return LocalDate.of(year, month, day);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String formatDate(LocalDate date) {
        if (date == null) {
            return "";
        }
        return String.format(Locale.ROOT, "%02d/%02d/%04d", date.getDayOfMonth(), date.getMonthValue(), date.getYear());
    }

    private String extractDateFromExpiryKeywordText(JsonNode... nodes) {
        if (nodes == null) {
            return "";
        }

        for (JsonNode node : nodes) {
            String value = extractDateFromExpiryKeywordText(node);
            if (!value.isBlank()) {
                return value;
            }
        }

        return "";
    }

    private String extractDateFromExpiryKeywordText(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return "";
        }

        if (node.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                String key = String.valueOf(entry.getKey() == null ? "" : entry.getKey()).toLowerCase(Locale.ROOT);
                JsonNode child = entry.getValue();

                if (child != null && child.isValueNode()) {
                    String value = child.asText("");
                    String candidate = extractDateFromKeywordLine(key, value);
                    if (!candidate.isBlank()) {
                        return candidate;
                    }
                }

                String nestedCandidate = extractDateFromExpiryKeywordText(child);
                if (!nestedCandidate.isBlank()) {
                    return nestedCandidate;
                }
            }
            return "";
        }

        if (node.isArray()) {
            for (JsonNode child : node) {
                String candidate = extractDateFromExpiryKeywordText(child);
                if (!candidate.isBlank()) {
                    return candidate;
                }
            }
            return "";
        }

        return "";
    }

    private String extractDateFromKeywordLine(String key, String value) {
        String safeValue = String.valueOf(value == null ? "" : value).trim();
        if (safeValue.isEmpty()) {
            return "";
        }

        String keyLower = String.valueOf(key == null ? "" : key).trim().toLowerCase(Locale.ROOT);
        String valueLower = safeValue.toLowerCase(Locale.ROOT);

        boolean hasExpiryKeyword = keyLower.contains("expire")
                || keyLower.contains("expiry")
                || keyLower.contains("expiration")
                || valueLower.contains("expires")
                || valueLower.contains("expire")
                || valueLower.contains("expiry")
                || valueLower.contains("date of expire")
                || valueLower.contains("co gia tri den")
                || valueLower.contains("có giá trị đến")
                || valueLower.contains("hieu luc den")
                || valueLower.contains("hiệu lực đến");

        if (!hasExpiryKeyword) {
            return "";
        }

        return normalizeDateToken(extractDateToken(safeValue));
    }

    private String extractDateToken(String text) {
        String safeText = String.valueOf(text == null ? "" : text).trim();
        if (safeText.isEmpty()) {
            return "";
        }

        Matcher matcher = OCR_DATE_PATTERN.matcher(safeText);
        if (!matcher.find()) {
            return "";
        }

        return matcher.group();
    }

    private String normalizeDateToken(String value) {
        String token = extractDateToken(value);
        if (!token.isBlank()) {
            return token.replace('.', '/').replace('-', '/');
        }

        LocalDate parsed = parseFlexibleDate(value);
        if (parsed != null) {
            return formatDate(parsed);
        }

        return normalizeOcrValue(value);
    }

    private String generateTempPassword() {
        return "Cust@" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }
}
