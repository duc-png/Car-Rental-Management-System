package com.example.car_management.service.impl;

import com.example.car_management.dto.request.AdminOwnerRegistrationDecisionRequest;
import com.example.car_management.dto.request.CreateOwnerRegistrationRequest;
import com.example.car_management.dto.response.OwnerRegistrationRequestResponse;
import com.example.car_management.entity.BrandEntity;
import com.example.car_management.entity.CarTypeEntity;
import com.example.car_management.entity.LocationEntity;
import com.example.car_management.entity.OwnerRegistration;
import com.example.car_management.entity.OwnerRegistrationImage;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.entity.VehicleImageEntity;
import com.example.car_management.entity.VehicleModelEntity;
import com.example.car_management.entity.enums.OwnerRegistrationStatus;
import com.example.car_management.entity.enums.UserRole;
import com.example.car_management.entity.enums.VehicleStatus;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.repository.BrandRepository;
import com.example.car_management.repository.CarTypeRepository;
import com.example.car_management.repository.LocationRepository;
import com.example.car_management.repository.OwnerRegistrationRepository;
import com.example.car_management.repository.OwnerRegistrationImageRepository;
import com.example.car_management.repository.UserRepository;
import com.example.car_management.repository.VehicleImageRepository;
import com.example.car_management.repository.VehicleFeatureRepository;
import com.example.car_management.repository.VehicleModelRepository;
import com.example.car_management.repository.VehicleRepository;
import com.example.car_management.service.OwnerRegistrationNotificationService;
import com.example.car_management.service.OwnerRegistrationService;
import com.example.car_management.service.NotificationService;
import com.example.car_management.service.cloud.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class OwnerRegistrationServiceImpl implements OwnerRegistrationService {

    private final OwnerRegistrationRepository ownerRegistrationRepository;
    private final OwnerRegistrationImageRepository imageRepository;
    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleImageRepository vehicleImageRepository;
    private final VehicleFeatureRepository vehicleFeatureRepository;
    private final VehicleModelRepository vehicleModelRepository;
    private final BrandRepository brandRepository;
    private final CarTypeRepository carTypeRepository;
    private final LocationRepository locationRepository;
    private final PasswordEncoder passwordEncoder;
    private final CloudinaryService cloudinaryService;
    private final OwnerRegistrationNotificationService ownerRegistrationNotificationService;
    private final NotificationService notificationService;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    private static final int MAX_IMAGES = 5;
    private static final BigDecimal DEFAULT_PRICE_PER_DAY = new BigDecimal("1.00");
    private static final String DEFAULT_CAR_TYPE_NAME = "Unknown";
    private static final long OWNER_EMAIL_OTP_EXPIRE_SECONDS = 300;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:no-reply@carrental.local}")
    private String fromEmail;

    private final Map<Integer, OwnerEmailOtpSession> ownerEmailOtpSessions = new ConcurrentHashMap<>();

    @Override
    @Transactional
    public OwnerRegistrationRequestResponse submit(CreateOwnerRegistrationRequest request,
            List<MultipartFile> images) {
        UserEntity authenticatedUser = getAuthenticatedUserOrNull();
        CreateOwnerRegistrationRequest.OwnerInfo ownerInfo = request.getOwner();

        if (authenticatedUser == null && ownerInfo == null) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        if (authenticatedUser != null && authenticatedUser.getRoleId() == UserRole.ADMIN) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (authenticatedUser != null && !Boolean.TRUE.equals(authenticatedUser.getIsVerified())) {
            issueOwnerEmailOtp(authenticatedUser);
            throw new AppException(ErrorCode.OWNER_REGISTRATION_EMAIL_NOT_VERIFIED);
        }

        // Chuan hoa key truoc khi check trung de tranh sai lech do hoa/thuong va khoang
        // trang.
        String normalizedEmail = authenticatedUser != null
                ? normalizeEmail(authenticatedUser.getEmail())
                : normalizeEmail(ownerInfo.getEmail());
        String normalizedLicensePlate = normalizeLicensePlate(request.getVehicle().getLicensePlate());

        // Bat buoc co anh va gioi han so luong anh theo rule dang ky.
        validateImages(images);

        // Guest flow: khong cho dang ky bang email da ton tai tai khoan.
        if (authenticatedUser == null && userRepository.existsByEmail(normalizedEmail)) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        if (ownerRegistrationRepository.existsByEmailAndStatusIn(
                normalizedEmail,
                List.of(OwnerRegistrationStatus.PENDING))) {
            throw new AppException(ErrorCode.OWNER_REGISTRATION_ALREADY_PENDING);
        }

        if (vehicleRepository.existsByLicensePlate(normalizedLicensePlate)) {
            throw new AppException(ErrorCode.LICENSE_PLATE_EXISTED);
        }

        if (ownerRegistrationRepository.existsByLicensePlateAndStatusIn(
                normalizedLicensePlate,
                List.of(OwnerRegistrationStatus.PENDING))) {
            throw new AppException(ErrorCode.OWNER_REGISTRATION_LICENSE_PLATE_PENDING);
        }

        OwnerRegistration entity = OwnerRegistration.builder()
                .fullName(authenticatedUser != null
                        ? authenticatedUser.getFullName()
                        : ownerInfo.getFullName().trim())
                .email(normalizedEmail)
                .phone(authenticatedUser != null
                        ? String.valueOf(authenticatedUser.getPhone() == null ? "" : authenticatedUser.getPhone())
                                .trim()
                        : ownerInfo.getPhone().trim())
                .passwordHash(authenticatedUser != null
                        ? authenticatedUser.getPassword()
                        : passwordEncoder.encode(ownerInfo.getPassword()))
                .licensePlate(normalizedLicensePlate)
                .brandName(request.getVehicle().getBrand().trim())
                .modelName(request.getVehicle().getModel().trim())
                .seatCount(request.getVehicle().getSeatCount())
                .manufacturingYear(request.getVehicle().getManufacturingYear())
                .transmission(request.getVehicle().getTransmission())
                .fuelType(request.getVehicle().getFuelType())
                .pricePerDay(request.getVehicle().getPricePerDay())
                .addressDetail(normalizeAddressDetail(request.getVehicle().getAddressDetail()))
                .discountEnabled(Boolean.TRUE.equals(request.getVehicle().getDiscountEnabled()))
                .discountPercent(request.getVehicle().getDiscountPercent())
                .instantBooking(request.getVehicle().getInstantBooking() == null
                        ? Boolean.TRUE
                        : request.getVehicle().getInstantBooking())
                .deliveryEnabled(request.getVehicle().getDeliveryEnabled() == null
                        ? Boolean.TRUE
                        : request.getVehicle().getDeliveryEnabled())
                .freeDeliveryWithinKm(request.getVehicle().getFreeDeliveryWithinKm())
                .maxDeliveryDistanceKm(request.getVehicle().getMaxDeliveryDistanceKm())
                .maxKmPerDay(request.getVehicle().getMaxKmPerDay())
                .extraFeePerKm(request.getVehicle().getExtraFeePerKm())
                .rentalTerms(request.getVehicle().getRentalTerms())
                .fuelConsumption(request.getVehicle().getFuelConsumption())
                .description(request.getVehicle().getDescription())
                .features(resolveFeatures(request.getVehicle().getFeatureIds()))
                .status(OwnerRegistrationStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        // Luu ho so, luu anh va thong bao admin co ho so moi can duyet.
        OwnerRegistration saved = ownerRegistrationRepository.save(entity);
        saveImages(saved, images);
        notificationService.notifyAdminsOwnerRegistrationSubmitted(saved);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OwnerRegistrationRequestResponse> listForAdmin(OwnerRegistrationStatus status) {
        // Admin co the xem tat ca ho so hoac loc theo trang thai de xu ly backlog.
        List<OwnerRegistration> entities = (status == null)
                ? ownerRegistrationRepository.findAllByOrderByCreatedAtDesc()
                : ownerRegistrationRepository.findAllByStatusOrderByCreatedAtDesc(status);

        return entities.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerRegistrationRequestResponse getDetailForAdmin(Integer requestId) {
        // Tra ve day du chi tiet ho so de admin tham dinh truoc khi approve/cancel.
        OwnerRegistration entity = ownerRegistrationRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.OWNER_REGISTRATION_NOT_FOUND));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public OwnerRegistrationRequestResponse approve(Integer requestId, AdminOwnerRegistrationDecisionRequest request) {
        // Buoc 1: lay ho so va dam bao dang o trang thai cho duyet.
        OwnerRegistration entity = ownerRegistrationRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.OWNER_REGISTRATION_NOT_FOUND));

        assertPending(entity);

        // Buoc 2: check rang buoc duy nhat cho xe truoc khi tao du lieu that.
        if (vehicleRepository.existsByLicensePlate(entity.getLicensePlate())) {
            throw new AppException(ErrorCode.LICENSE_PLATE_EXISTED);
        }

        // Buoc 3: neu email da co tai khoan customer thi nang quyen len owner,
        // neu chua co thi tao tai khoan owner moi.
        UserEntity savedOwner = userRepository.findByEmail(entity.getEmail())
                .map(existingUser -> {
                    if (existingUser.getRoleId() == UserRole.ADMIN) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                    }
                    if (existingUser.getRoleId() != UserRole.CAR_OWNER) {
                        existingUser.setRoleId(UserRole.CAR_OWNER);
                    }
                    if (existingUser.getIsActive() == null) {
                        existingUser.setIsActive(true);
                    }
                    if (existingUser.getPhone() == null || existingUser.getPhone().isBlank()) {
                        existingUser.setPhone(entity.getPhone());
                    }
                    if (existingUser.getFullName() == null || existingUser.getFullName().isBlank()) {
                        existingUser.setFullName(entity.getFullName());
                    }
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    UserEntity owner = UserEntity.builder()
                            .fullName(entity.getFullName())
                            .email(entity.getEmail())
                            .password(entity.getPasswordHash())
                            .phone(entity.getPhone())
                            .isVerified(false)
                            .isActive(true)
                            .createdAt(Instant.now())
                            .roleId(UserRole.CAR_OWNER)
                            .build();
                    return userRepository.save(owner);
                });
        Instant vehicleReviewedAt = Instant.now();

        // Buoc 4: tao xe that va dua vao trang thai AVAILABLE sau khi admin duyet.
        VehicleModelEntity model = resolveOrCreateModel(entity.getBrandName(), entity.getModelName());
        boolean deliveryEnabled = entity.getDeliveryEnabled() == null
                || Boolean.TRUE.equals(entity.getDeliveryEnabled());
        VehicleEntity vehicle = VehicleEntity.builder()
                .owner(savedOwner)
                .model(model)
                .licensePlate(entity.getLicensePlate())
                .seatCount(entity.getSeatCount())
                .transmission(entity.getTransmission())
                .fuelType(entity.getFuelType())
                .pricePerDay(entity.getPricePerDay() != null ? entity.getPricePerDay() : DEFAULT_PRICE_PER_DAY)
                .status(VehicleStatus.AVAILABLE)
                .description(entity.getDescription() != null ? entity.getDescription().trim() : null)
                .year(entity.getManufacturingYear())
                .fuelConsumption(entity.getFuelConsumption() != null ? entity.getFuelConsumption().floatValue() : null)
                .currentKm(0)
                .reviewedAt(vehicleReviewedAt)
                .deliveryEnabled(deliveryEnabled)
                .freeDeliveryWithinKm(deliveryEnabled
                        ? (entity.getFreeDeliveryWithinKm() == null ? 0 : Math.max(0, entity.getFreeDeliveryWithinKm()))
                        : null)
                .maxDeliveryDistanceKm(deliveryEnabled
                        ? (entity.getMaxDeliveryDistanceKm() == null ? 20
                                : Math.max(0, entity.getMaxDeliveryDistanceKm()))
                        : null)
                .extraFeePerKm(deliveryEnabled
                        ? (entity.getExtraFeePerKm() == null || entity.getExtraFeePerKm().compareTo(BigDecimal.ZERO) < 0
                                ? new BigDecimal("10000")
                                : entity.getExtraFeePerKm())
                        : null)
                .location(resolveLocationFromRegistrationAddress(entity.getAddressDetail()))
                .color(null)
                .features(entity.getFeatures() == null ? new java.util.LinkedHashSet<>()
                        : new java.util.LinkedHashSet<>(entity.getFeatures()))
                .build();

        VehicleEntity savedVehicle = vehicleRepository.save(vehicle);
        // Dong bo fallback cho truong hop da ton tai ban ghi cung bien so dang pending
        // approval.
        enforceRegistrationVehicleApproved(savedOwner.getId(), entity.getLicensePlate(), vehicleReviewedAt);
        // Sao chep bo anh dang ky sang anh xe van hanh.
        copyRegistrationImagesToVehicle(entity.getId(), savedVehicle);

        // Buoc 5: cap nhat ket qua duyet vao ho so dang ky.
        entity.setStatus(OwnerRegistrationStatus.APPROVED);
        entity.setAdminNote(request != null ? request.getNote() : null);
        entity.setReviewedAt(Instant.now());
        entity.setReviewedBy(getCurrentUser());
        entity.setApprovedOwner(savedOwner);

        OwnerRegistration savedRegistration = ownerRegistrationRepository.save(entity);
        // Buoc 6: thong bao ket qua cho owner (email + notification trong he thong).
        ownerRegistrationNotificationService.sendApprovedEmail(savedRegistration);
        notificationService.notifyOwnerVehicleApproved(savedVehicle);
        return toResponse(savedRegistration);
    }

    @Override
    @Transactional
    public void sendOwnerEmailVerificationOtp(Integer userId) {
        UserEntity user = getUserForOwnerRegistration(userId);
        if (Boolean.TRUE.equals(user.getIsVerified())) {
            return;
        }
        issueOwnerEmailOtp(user);
    }

    @Override
    @Transactional
    public void verifyOwnerEmailVerificationOtp(Integer userId, String otp) {
        UserEntity user = getUserForOwnerRegistration(userId);

        OwnerEmailOtpSession session = ownerEmailOtpSessions.get(user.getId());
        if (session == null) {
            throw new AppException(ErrorCode.EMAIL_OTP_NOT_FOUND);
        }

        if (Instant.now().isAfter(session.expireAt())) {
            ownerEmailOtpSessions.remove(user.getId());
            throw new AppException(ErrorCode.EMAIL_OTP_EXPIRED);
        }

        if (!session.email().equalsIgnoreCase(String.valueOf(user.getEmail() == null ? "" : user.getEmail()).trim())) {
            throw new AppException(ErrorCode.EMAIL_OTP_INVALID);
        }

        String normalizedOtp = String.valueOf(otp == null ? "" : otp).trim();
        if (!session.otp().equals(normalizedOtp)) {
            throw new AppException(ErrorCode.EMAIL_OTP_INVALID);
        }

        user.setIsVerified(true);
        userRepository.save(user);
        ownerEmailOtpSessions.remove(user.getId());
    }

    private void enforceRegistrationVehicleApproved(Integer ownerId, String licensePlate, Instant reviewedAt) {
        if (ownerId == null || licensePlate == null || licensePlate.isBlank()) {
            return;
        }

        String normalizedTargetPlate = normalizeLicensePlate(licensePlate);
        List<VehicleEntity> ownerVehicles = vehicleRepository.findByOwner_Id(ownerId);
        for (VehicleEntity ownerVehicle : ownerVehicles) {
            if (ownerVehicle == null || ownerVehicle.getLicensePlate() == null) {
                continue;
            }

            String ownerVehiclePlate = normalizeLicensePlate(ownerVehicle.getLicensePlate());
            if (normalizedTargetPlate.equals(ownerVehiclePlate)
                    && ownerVehicle.getStatus() == VehicleStatus.PENDING_APPROVAL) {
                ownerVehicle.setStatus(VehicleStatus.AVAILABLE);
                ownerVehicle.setReviewedAt(reviewedAt == null ? Instant.now() : reviewedAt);
            }
        }
    }

    private VehicleModelEntity resolveOrCreateModel(String brandNameRaw, String modelNameRaw) {
        String brandName = normalizeName(brandNameRaw);
        String modelName = normalizeName(modelNameRaw);

        if (brandName == null || brandName.isBlank() || modelName == null || modelName.isBlank()) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        // Tai su dung model da co; neu chua co thi tao moi brand/type/model theo du
        // lieu dang ky.
        return vehicleModelRepository.findByNameIgnoreCaseAndBrand_NameIgnoreCase(modelName, brandName)
                .orElseGet(() -> {
                    BrandEntity brand = brandRepository.findByNameIgnoreCase(brandName)
                            .orElseGet(() -> brandRepository.save(BrandEntity.builder().name(brandName).build()));

                    CarTypeEntity type = carTypeRepository.findByNameIgnoreCase(DEFAULT_CAR_TYPE_NAME)
                            .orElseGet(() -> carTypeRepository
                                    .save(CarTypeEntity.builder().name(DEFAULT_CAR_TYPE_NAME).build()));

                    VehicleModelEntity created = VehicleModelEntity.builder()
                            .brand(brand)
                            .type(type)
                            .name(modelName)
                            .build();
                    return vehicleModelRepository.save(created);
                });
    }

    private void copyRegistrationImagesToVehicle(Integer requestId, VehicleEntity vehicle) {
        List<OwnerRegistrationImage> images = imageRepository.findByRequest_IdOrderByIdAsc(requestId);
        if (images == null || images.isEmpty())
            return;

        List<VehicleImageEntity> toSave = new java.util.ArrayList<>(images.size());
        for (int i = 0; i < images.size(); i++) {
            OwnerRegistrationImage src = images.get(i);
            boolean isMain = Boolean.TRUE.equals(src.getIsMain()) || (src.getIsMain() == null && i == 0);
            toSave.add(VehicleImageEntity.builder()
                    .vehicle(vehicle)
                    .imageUrl(src.getImageUrl())
                    .isMain(isMain)
                    .build());
        }
        vehicleImageRepository.saveAll(toSave);
    }

    private String normalizeName(String value) {
        return value == null ? null : value.trim();
    }

    private LocationEntity resolveLocationFromRegistrationAddress(String addressDetailRaw) {
        if (addressDetailRaw == null || addressDetailRaw.trim().isEmpty()) {
            return null;
        }

        // Tach province/district/ward tu address string de tao location phu hop cho xe
        // vua
        // duoc duyet.
        String normalizedAddress = normalizeAddressDetail(addressDetailRaw);
        List<String> parts = Arrays.stream(normalizedAddress.split(","))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .toList();

        String province = truncate(parts.isEmpty() ? normalizedAddress : parts.get(parts.size() - 1), 100);
        String district = truncate(parts.size() >= 3 ? parts.get(parts.size() - 2) : "Chưa rõ", 100);
        String ward = truncate(parts.size() >= 4 ? parts.get(parts.size() - 3)
                : (parts.size() >= 2 ? parts.get(parts.size() - 2) : "Chưa rõ"), 100);
        String addressDetail = truncate(normalizedAddress, 255);

        LocationEntity location = LocationEntity.builder()
                .province(province == null || province.isBlank() ? "Chưa rõ" : province)
                .district(district == null || district.isBlank() ? "Chưa rõ" : district)
                .ward(ward == null || ward.isBlank() ? "Chưa rõ" : ward)
                .addressDetail(addressDetail)
                .build();

        return locationRepository.save(location);
    }

    private String normalizeAddressDetail(String value) {
        if (value == null) {
            return null;
        }
        return value.trim().replaceAll("\\s+", " ");
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.length() <= maxLength) {
            return normalized;
        }
        return normalized.substring(0, maxLength);
    }

    @Override
    @Transactional
    public OwnerRegistrationRequestResponse cancel(Integer requestId, AdminOwnerRegistrationDecisionRequest request) {
        // Huy ho so chi hop le khi ho so con PENDING.
        OwnerRegistration entity = ownerRegistrationRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.OWNER_REGISTRATION_NOT_FOUND));

        assertPending(entity);

        entity.setStatus(OwnerRegistrationStatus.CANCELLED);
        entity.setAdminNote(request != null ? request.getNote() : null);
        entity.setReviewedAt(Instant.now());
        entity.setReviewedBy(getCurrentUser());

        OwnerRegistration savedRegistration = ownerRegistrationRepository.save(entity);
        // Gui thong bao tu choi qua email cho nguoi dang ky.
        ownerRegistrationNotificationService.sendRejectedEmail(savedRegistration);
        return toResponse(savedRegistration);
    }

    private void assertPending(OwnerRegistration entity) {
        if (entity.getStatus() != OwnerRegistrationStatus.PENDING) {
            throw new AppException(ErrorCode.OWNER_REGISTRATION_INVALID_STATUS);
        }
    }

    private UserEntity getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private UserEntity getAuthenticatedUserOrNull() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        String email = String.valueOf(authentication.getName() == null ? "" : authentication.getName()).trim();
        if (email.isEmpty() || "anonymousUser".equalsIgnoreCase(email)) {
            return null;
        }

        return userRepository.findByEmail(email).orElse(null);
    }

    private UserEntity getUserForOwnerRegistration(Integer userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        if (user.getRoleId() == UserRole.ADMIN) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return user;
    }

    private void issueOwnerEmailOtp(UserEntity user) {
        String email = normalizeEmail(user.getEmail());
        if (email == null || email.isBlank()) {
            throw new AppException(ErrorCode.EMAIL_OTP_SEND_FAILED);
        }

        String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));
        Instant expireAt = Instant.now().plusSeconds(OWNER_EMAIL_OTP_EXPIRE_SECONDS);

        ownerEmailOtpSessions.put(user.getId(), new OwnerEmailOtpSession(email, otp, expireAt));
        sendOwnerEmailOtp(email, user.getFullName(), otp);
    }

    private void sendOwnerEmailOtp(String toEmail, String fullName, String otp) {
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
            message.setSubject("[CarRental] Ma OTP xac thuc email de tro thanh chu xe");
            message.setText("Xin chao " + displayName + ",\n\n"
                    + "Ma OTP de xac thuc email truoc khi dang ky tro thanh chu xe la: " + otp + "\n"
                    + "Ma co hieu luc trong 5 phut.\n\n"
                    + "CarRental");

            mailSender.send(message);
        } catch (Exception ex) {
            throw new AppException(ErrorCode.EMAIL_OTP_SEND_FAILED);
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String normalizeLicensePlate(String licensePlate) {
        return licensePlate == null ? null : licensePlate.trim().toUpperCase();
    }

    private OwnerRegistrationRequestResponse toResponse(OwnerRegistration entity) {
        var images = imageRepository.findByRequest_IdOrderByIdAsc(entity.getId())
                .stream()
                .map(OwnerRegistrationImage::getImageUrl)
                .toList();
        return OwnerRegistrationRequestResponse.builder()
                .requestId(entity.getId())
                .fullName(entity.getFullName())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .licensePlate(entity.getLicensePlate())
                .brandName(entity.getBrandName())
                .modelName(entity.getModelName())
                .seatCount(entity.getSeatCount())
                .manufacturingYear(entity.getManufacturingYear())
                .transmission(entity.getTransmission())
                .fuelType(entity.getFuelType())
                .addressDetail(entity.getAddressDetail())
                .fuelConsumption(entity.getFuelConsumption())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .adminNote(entity.getAdminNote())
                .createdAt(entity.getCreatedAt())
                .reviewedAt(entity.getReviewedAt())
                .reviewedById(entity.getReviewedBy() != null ? entity.getReviewedBy().getId() : null)
                .reviewedByName(entity.getReviewedBy() != null ? entity.getReviewedBy().getFullName() : null)
                .approvedOwnerId(entity.getApprovedOwner() != null ? entity.getApprovedOwner().getId() : null)
                .vehicleImageUrls(images)
                .features(entity.getFeatures() == null
                        ? List.of()
                        : entity.getFeatures().stream()
                                .map(feature -> com.example.car_management.dto.response.VehicleFeatureResponse.builder()
                                        .id(feature.getId())
                                        .name(feature.getName())
                                        .build())
                                .sorted((a, b) -> {
                                    String left = a.getName() == null ? "" : a.getName();
                                    String right = b.getName() == null ? "" : b.getName();
                                    return left.compareToIgnoreCase(right);
                                })
                                .toList())
                .build();
    }

    private Set<com.example.car_management.entity.VehicleFeatureEntity> resolveFeatures(List<Integer> featureIds) {
        if (featureIds == null || featureIds.isEmpty()) {
            return new java.util.LinkedHashSet<>();
        }

        List<Integer> ids = featureIds.stream().filter(java.util.Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) {
            return new java.util.LinkedHashSet<>();
        }

        List<com.example.car_management.entity.VehicleFeatureEntity> found = vehicleFeatureRepository.findAllById(ids);
        if (found.size() != ids.size()) {
            throw new AppException(ErrorCode.VEHICLE_FEATURE_NOT_FOUND);
        }

        return new java.util.LinkedHashSet<>(found);
    }

    private void validateImages(List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            throw new AppException(ErrorCode.OWNER_REGISTRATION_IMAGES_REQUIRED);
        }
        if (images.size() > MAX_IMAGES) {
            throw new AppException(ErrorCode.OWNER_REGISTRATION_IMAGES_LIMIT);
        }
    }

    private void saveImages(OwnerRegistration request, List<MultipartFile> images) {
        // Upload tung anh len cloud va danh dau anh dau tien la anh dai dien.
        List<OwnerRegistrationImage> toSave = new java.util.ArrayList<>();
        for (int i = 0; i < images.size(); i++) {
            MultipartFile file = images.get(i);
            String url = cloudinaryService.uploadOwnerRegistrationImage(file, request.getId());
            OwnerRegistrationImage img = OwnerRegistrationImage.builder()
                    .request(request)
                    .imageUrl(url)
                    .isMain(i == 0)
                    .build();
            toSave.add(img);
        }
        imageRepository.saveAll(toSave);
    }

    private record OwnerEmailOtpSession(String email, String otp, Instant expireAt) {
    }
}
