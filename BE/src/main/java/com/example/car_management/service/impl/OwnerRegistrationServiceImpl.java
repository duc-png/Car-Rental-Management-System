package com.example.car_management.service.impl;

import com.example.car_management.dto.request.AdminOwnerRegistrationDecisionRequest;
import com.example.car_management.dto.request.CreateOwnerRegistrationRequest;
import com.example.car_management.dto.response.OwnerRegistrationRequestResponse;
import com.example.car_management.entity.BrandEntity;
import com.example.car_management.entity.CarTypeEntity;
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
import com.example.car_management.repository.OwnerRegistrationRepository;
import com.example.car_management.repository.OwnerRegistrationImageRepository;
import com.example.car_management.repository.UserRepository;
import com.example.car_management.repository.VehicleImageRepository;
import com.example.car_management.repository.VehicleFeatureRepository;
import com.example.car_management.repository.VehicleModelRepository;
import com.example.car_management.repository.VehicleRepository;
import com.example.car_management.service.OwnerRegistrationService;
import com.example.car_management.service.cloud.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

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
    private final PasswordEncoder passwordEncoder;
    private final CloudinaryService cloudinaryService;

    private static final int MAX_IMAGES = 5;
    private static final BigDecimal DEFAULT_PRICE_PER_DAY = new BigDecimal("1.00");
    private static final String DEFAULT_CAR_TYPE_NAME = "Unknown";

    @Override
    @Transactional
    public OwnerRegistrationRequestResponse submit(CreateOwnerRegistrationRequest request,
            List<MultipartFile> images) {
        String normalizedEmail = normalizeEmail(request.getOwner().getEmail());
        String normalizedLicensePlate = normalizeLicensePlate(request.getVehicle().getLicensePlate());

        validateImages(images);

        if (userRepository.existsByEmail(normalizedEmail)) {
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
                .fullName(request.getOwner().getFullName().trim())
                .email(normalizedEmail)
                .phone(request.getOwner().getPhone().trim())
                .passwordHash(passwordEncoder.encode(request.getOwner().getPassword()))
                .licensePlate(normalizedLicensePlate)
                .brandName(request.getVehicle().getBrand().trim())
                .modelName(request.getVehicle().getModel().trim())
                .seatCount(request.getVehicle().getSeatCount())
                .manufacturingYear(request.getVehicle().getManufacturingYear())
                .transmission(request.getVehicle().getTransmission())
                .fuelType(request.getVehicle().getFuelType())
                .fuelConsumption(request.getVehicle().getFuelConsumption())
                .description(request.getVehicle().getDescription())
                .features(resolveFeatures(request.getVehicle().getFeatureIds()))
                .status(OwnerRegistrationStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        OwnerRegistration saved = ownerRegistrationRepository.save(entity);
        saveImages(saved, images);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OwnerRegistrationRequestResponse> listForAdmin(OwnerRegistrationStatus status) {
        List<OwnerRegistration> entities = (status == null)
                ? ownerRegistrationRepository.findAllByOrderByCreatedAtDesc()
                : ownerRegistrationRepository.findAllByStatusOrderByCreatedAtDesc(status);

        return entities.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerRegistrationRequestResponse getDetailForAdmin(Integer requestId) {
        OwnerRegistration entity = ownerRegistrationRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.OWNER_REGISTRATION_NOT_FOUND));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public OwnerRegistrationRequestResponse approve(Integer requestId, AdminOwnerRegistrationDecisionRequest request) {
        OwnerRegistration entity = ownerRegistrationRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.OWNER_REGISTRATION_NOT_FOUND));

        assertPending(entity);

        if (userRepository.existsByEmail(entity.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        if (vehicleRepository.existsByLicensePlate(entity.getLicensePlate())) {
            throw new AppException(ErrorCode.LICENSE_PLATE_EXISTED);
        }

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

        UserEntity savedOwner = userRepository.save(owner);

        VehicleModelEntity model = resolveOrCreateModel(entity.getBrandName(), entity.getModelName());
        VehicleEntity vehicle = VehicleEntity.builder()
                .owner(savedOwner)
                .model(model)
                .licensePlate(entity.getLicensePlate())
                .seatCount(entity.getSeatCount())
                .transmission(entity.getTransmission())
                .fuelType(entity.getFuelType())
                .pricePerDay(DEFAULT_PRICE_PER_DAY)
                .status(VehicleStatus.PENDING_APPROVAL)
                .description(entity.getDescription() != null ? entity.getDescription().trim() : null)
                .year(entity.getManufacturingYear())
                .fuelConsumption(entity.getFuelConsumption() != null ? entity.getFuelConsumption().floatValue() : null)
                .currentKm(0)
                .location(null)
                .color(null)
                .features(entity.getFeatures() == null ? new java.util.LinkedHashSet<>()
                        : new java.util.LinkedHashSet<>(entity.getFeatures()))
                .build();

        VehicleEntity savedVehicle = vehicleRepository.save(vehicle);
        copyRegistrationImagesToVehicle(entity.getId(), savedVehicle);

        entity.setStatus(OwnerRegistrationStatus.APPROVED);
        entity.setAdminNote(request != null ? request.getNote() : null);
        entity.setReviewedAt(Instant.now());
        entity.setReviewedBy(getCurrentUser());
        entity.setApprovedOwner(savedOwner);

        return toResponse(ownerRegistrationRepository.save(entity));
    }

    private VehicleModelEntity resolveOrCreateModel(String brandNameRaw, String modelNameRaw) {
        String brandName = normalizeName(brandNameRaw);
        String modelName = normalizeName(modelNameRaw);

        if (brandName == null || brandName.isBlank() || modelName == null || modelName.isBlank()) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

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

    @Override
    @Transactional
    public OwnerRegistrationRequestResponse cancel(Integer requestId, AdminOwnerRegistrationDecisionRequest request) {
        OwnerRegistration entity = ownerRegistrationRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.OWNER_REGISTRATION_NOT_FOUND));

        assertPending(entity);

        entity.setStatus(OwnerRegistrationStatus.CANCELLED);
        entity.setAdminNote(request != null ? request.getNote() : null);
        entity.setReviewedAt(Instant.now());
        entity.setReviewedBy(getCurrentUser());

        return toResponse(ownerRegistrationRepository.save(entity));
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
}
