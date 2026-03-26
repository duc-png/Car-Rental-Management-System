package com.example.car_management.service.impl;

import com.example.car_management.dto.request.*;
import com.example.car_management.dto.response.*;
import com.example.car_management.entity.*;
import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.entity.enums.VehicleStatus;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.mapper.VehicleMapper;
import com.example.car_management.repository.*;
import com.example.car_management.service.NotificationService;
import com.example.car_management.service.VehicleService;
import com.example.car_management.service.cloud.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final VehicleModelRepository vehicleModelRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final VehicleImageRepository vehicleImageRepository;
    private final VehicleFeatureRepository vehicleFeatureRepository;
    private final BookingRepository bookingRepository;
    private final CloudinaryService cloudinaryService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public VehicleResponse createVehicle(CreateVehicleRequest req) {
        // 1) Validate bien so la duy nhat truoc khi tao xe.
        if (vehicleRepository.existsByLicensePlate(req.getLicensePlate())) {
            throw new AppException(ErrorCode.LICENSE_PLATE_EXISTED);
        }

        // 2) Resolve owner/model/location tu request de tao entity day du lien ket.
        UserEntity owner = userRepository.findById(getCurrentUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        VehicleModelEntity model = vehicleModelRepository.findByIdWithBrandAndType(req.getModelId())
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND));
        LocationEntity location = resolveLocation(req.getLocationId(), req.getLocation());

        VehicleEntity v = VehicleEntity.builder()
                .owner(owner)
                .model(model)
                .licensePlate(req.getLicensePlate())
                .color(req.getColor())
                .seatCount(req.getSeatCount())
                .transmission(req.getTransmission())
                .fuelType(req.getFuelType())
                .pricePerDay(req.getPricePerDay())
                .status(VehicleStatus.PENDING_APPROVAL)
                .description(req.getDescription() != null ? req.getDescription().trim() : null)
                .year(req.getYear())
                .fuelConsumption(req.getFuelConsumption())
                .currentKm(req.getCurrentKm() == null ? 0 : req.getCurrentKm())
                .deliveryEnabled(resolveDeliveryEnabled(req.getDeliveryEnabled()))
                .freeDeliveryWithinKm(normalizeDeliveryDistance(req.getFreeDeliveryWithinKm()))
                .maxDeliveryDistanceKm(normalizeDeliveryDistance(req.getMaxDeliveryDistanceKm()))
                .extraFeePerKm(normalizeExtraFee(req.getExtraFeePerKm()))
                .location(location)
                .features(resolveFeatures(req.getFeatureIds()))
                .build();

        applyDeliveryRules(v);

        // 3) Xe moi cua chu xe vao trang thai PENDING_APPROVAL va gui thong bao cho
        // admin.
        VehicleEntity saved = vehicleRepository.save(v);
        notificationService.notifyAdminsVehicleSubmitted(saved);
        return VehicleMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleResponse getVehicleDetail(Integer id) {
        VehicleEntity v = vehicleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

        // force load images if needed
        v.setImages(vehicleImageRepository.findByVehicle_Id(v.getId()));
        return VehicleMapper.toResponse(v);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleResponse> listVehicles(Integer ownerId) {
        List<VehicleEntity> list = (ownerId == null)
                ? vehicleRepository.findAll()
                : vehicleRepository.findByOwner_Id(ownerId);

        // load images for each vehicle (simple way)
        return list.stream().map(v -> {
            v.setImages(vehicleImageRepository.findByVehicle_Id(v.getId()));
            return VehicleMapper.toResponse(v);
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public VehicleResponse updateVehicle(Integer id, Integer ownerId, UpdateVehicleRequest req) {

        VehicleEntity v = vehicleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

        // Chi chu xe so huu moi duoc cap nhat xe.
        assertOwner(v, ownerId);

        // Xe dang cho admin duyet thi khong duoc chinh sua trong qua trinh tham dinh.
        if (v.getStatus() == VehicleStatus.PENDING_APPROVAL) {
            throw new AppException(ErrorCode.VEHICLE_APPROVAL_REQUIRED);
        }

        boolean resubmitForApproval = v.getStatus() == VehicleStatus.REJECTED;

        // Chan cap nhat cac field co dinh (model/bien so/seat/fuel/year).
        assertImmutableFields(req, v);

        if (req.getColor() != null)
            v.setColor(req.getColor());
        if (req.getTransmission() != null)
            v.setTransmission(req.getTransmission());
        if (req.getPricePerDay() != null)
            v.setPricePerDay(req.getPricePerDay());
        if (req.getDescription() != null)
            v.setDescription(req.getDescription().trim());
        if (req.getFuelConsumption() != null)
            v.setFuelConsumption(req.getFuelConsumption());
        if (req.getCurrentKm() != null)
            v.setCurrentKm(req.getCurrentKm());
        if (req.getDeliveryEnabled() != null)
            v.setDeliveryEnabled(resolveDeliveryEnabled(req.getDeliveryEnabled()));
        if (req.getFreeDeliveryWithinKm() != null)
            v.setFreeDeliveryWithinKm(normalizeDeliveryDistance(req.getFreeDeliveryWithinKm()));
        if (req.getMaxDeliveryDistanceKm() != null)
            v.setMaxDeliveryDistanceKm(normalizeDeliveryDistance(req.getMaxDeliveryDistanceKm()));
        if (req.getExtraFeePerKm() != null)
            v.setExtraFeePerKm(normalizeExtraFee(req.getExtraFeePerKm()));
        if (req.getStatus() != null) {
            throw new AppException(ErrorCode.VEHICLE_APPROVAL_REQUIRED);
        }
        if (req.getFeatureIds() != null)
            v.setFeatures(resolveFeatures(req.getFeatureIds()));

        applyDeliveryRules(v);

        // Update location chỉ nếu có locationId hoặc location data được gửi
        boolean hasLocationIdOrData = req.getLocationId() != null
                || (req.getLocation() != null && hasAnyLocationData(req.getLocation()));
        if (hasLocationIdOrData) {
            LocationEntity location = resolveLocationForUpdate(req.getLocationId(), req.getLocation(), v.getLocation());
            v.setLocation(location);
        }

        VehicleEntity saved = vehicleRepository.save(v);

        // Xe bi tu choi sau khi chu xe sua thong tin thi gui lai luong duyet.
        if (resubmitForApproval) {
            saved.setStatus(VehicleStatus.PENDING_APPROVAL);
            saved.setReviewedAt(null);
            notificationService.notifyAdminsVehicleSubmitted(saved);
        }

        // chỉ load images để map response, KHÔNG set vào entity
        List<VehicleImageEntity> imgs = vehicleImageRepository.findByVehicle_Id(saved.getId());
        return VehicleMapper.toResponse(saved, imgs);
    }

    private void assertImmutableFields(UpdateVehicleRequest req, VehicleEntity vehicle) {
        if (req.getModelId() != null && vehicle.getModel() != null
                && !req.getModelId().equals(vehicle.getModel().getId())) {
            throw new AppException(ErrorCode.VEHICLE_IMMUTABLE_FIELDS);
        }

        if (req.getLicensePlate() != null) {
            String currentPlate = vehicle.getLicensePlate() == null ? "" : vehicle.getLicensePlate().trim();
            String requestedPlate = req.getLicensePlate().trim();
            if (!requestedPlate.equalsIgnoreCase(currentPlate)) {
                throw new AppException(ErrorCode.VEHICLE_IMMUTABLE_FIELDS);
            }
        }

        if (req.getSeatCount() != null && !req.getSeatCount().equals(vehicle.getSeatCount())) {
            throw new AppException(ErrorCode.VEHICLE_IMMUTABLE_FIELDS);
        }

        if (req.getFuelType() != null && req.getFuelType() != vehicle.getFuelType()) {
            throw new AppException(ErrorCode.VEHICLE_IMMUTABLE_FIELDS);
        }

        if (req.getYear() != null && !req.getYear().equals(vehicle.getYear())) {
            throw new AppException(ErrorCode.VEHICLE_IMMUTABLE_FIELDS);
        }
    }

    private java.util.Set<VehicleFeatureEntity> resolveFeatures(List<Integer> featureIds) {
        if (featureIds == null || featureIds.isEmpty()) {
            return new java.util.LinkedHashSet<>();
        }

        List<Integer> ids = featureIds.stream()
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();

        if (ids.isEmpty()) {
            return new java.util.LinkedHashSet<>();
        }

        List<VehicleFeatureEntity> found = vehicleFeatureRepository.findAllById(ids);
        if (found.size() != ids.size()) {
            throw new AppException(ErrorCode.VEHICLE_FEATURE_NOT_FOUND);
        }

        return new java.util.LinkedHashSet<>(found);
    }

    private boolean hasAnyLocationData(LocationInputRequest loc) {
        if (loc == null)
            return false;
        return (loc.getProvince() != null && !loc.getProvince().trim().isEmpty())
                || (loc.getDistrict() != null && !loc.getDistrict().trim().isEmpty())
                || (loc.getWard() != null && !loc.getWard().trim().isEmpty())
                || (loc.getAddressDetail() != null && !loc.getAddressDetail().trim().isEmpty());
    }

    private LocationEntity resolveLocationForUpdate(Integer locationId, LocationInputRequest locationInput,
            LocationEntity currentLocation) {
        if (locationId != null) {
            return locationRepository.findById(locationId)
                    .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_FOUND));
        }

        if (locationInput == null || !hasAnyLocationData(locationInput)) {
            return currentLocation;
        }

        String province = firstNonBlank(locationInput.getProvince(),
                currentLocation != null ? currentLocation.getProvince() : null);
        String district = firstNonBlank(locationInput.getDistrict(),
                currentLocation != null ? currentLocation.getDistrict() : null);
        String ward = firstNonBlank(locationInput.getWard(),
                currentLocation != null ? currentLocation.getWard() : null);
        String addressDetail = firstNonBlank(locationInput.getAddressDetail(),
                currentLocation != null ? currentLocation.getAddressDetail() : null);

        // locations table yêu cầu city/district/ward bắt buộc, nên chặn sớm để tránh
        // DataIntegrityViolationException.
        if (isBlank(province) || isBlank(district) || isBlank(ward)) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        if (currentLocation != null) {
            currentLocation.setProvince(province);
            currentLocation.setDistrict(district);
            currentLocation.setWard(ward);
            currentLocation.setAddressDetail(addressDetail);
            return locationRepository.save(currentLocation);
        }

        LocationEntity location = LocationEntity.builder()
                .province(province)
                .district(district)
                .ward(ward)
                .addressDetail(addressDetail)
                .build();

        return locationRepository.save(location);
    }

    private String firstNonBlank(String candidate, String fallback) {
        if (!isBlank(candidate)) {
            return candidate.trim();
        }
        if (!isBlank(fallback)) {
            return fallback.trim();
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private LocationEntity resolveLocation(Integer locationId, LocationInputRequest locationInput) {
        if (locationId != null) {
            return locationRepository.findById(locationId)
                    .orElseThrow(() -> new AppException(ErrorCode.LOCATION_NOT_FOUND));
        }

        if (locationInput == null) {
            return null;
        }

        LocationEntity location = LocationEntity.builder()
                .province(locationInput.getProvince() != null ? locationInput.getProvince().trim() : null)
                .district(locationInput.getDistrict() != null ? locationInput.getDistrict().trim() : null)
                .ward(locationInput.getWard() != null ? locationInput.getWard().trim() : null)
                .addressDetail(
                        locationInput.getAddressDetail() != null ? locationInput.getAddressDetail().trim() : null)
                .build();

        return locationRepository.save(location);
    }

    private String normalizePlate(String plate) {
        if (plate == null)
            return null;
        return plate.trim().toUpperCase(); // tùy rule, nhưng trim là bắt buộc
    }

    private Boolean resolveDeliveryEnabled(Boolean deliveryEnabled) {
        return deliveryEnabled == null ? Boolean.TRUE : deliveryEnabled;
    }

    private Integer normalizeDeliveryDistance(Integer km) {
        if (km == null) {
            return null;
        }
        return Math.max(0, km);
    }

    private BigDecimal normalizeExtraFee(BigDecimal fee) {
        if (fee == null) {
            return null;
        }
        return fee.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : fee;
    }

    private void applyDeliveryRules(VehicleEntity vehicle) {
        if (!Boolean.TRUE.equals(vehicle.getDeliveryEnabled())) {
            vehicle.setFreeDeliveryWithinKm(null);
            vehicle.setMaxDeliveryDistanceKm(null);
            vehicle.setExtraFeePerKm(null);
            return;
        }

        if (vehicle.getFreeDeliveryWithinKm() == null) {
            vehicle.setFreeDeliveryWithinKm(0);
        }
        if (vehicle.getMaxDeliveryDistanceKm() == null) {
            vehicle.setMaxDeliveryDistanceKm(20);
        }
        if (vehicle.getExtraFeePerKm() == null) {
            vehicle.setExtraFeePerKm(new BigDecimal("10000"));
        }

        if (vehicle.getFreeDeliveryWithinKm() > vehicle.getMaxDeliveryDistanceKm()) {
            vehicle.setFreeDeliveryWithinKm(vehicle.getMaxDeliveryDistanceKm());
        }
    }

    @Override
    @Transactional
    public void deleteVehicle(Integer id, Integer ownerId) {
        VehicleEntity v = vehicleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));
        assertOwner(v, ownerId);
        vehicleRepository.delete(v);
    }

    @Override
    @Transactional
    public VehicleResponse updateStatus(Integer id, Integer ownerId, UpdateVehicleStatusRequest req) {
        VehicleEntity v = vehicleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));
        assertOwner(v, ownerId);

        // Chu xe khong duoc tu duyet xe dang pending/rejected.
        if (v.getStatus() == VehicleStatus.PENDING_APPROVAL || v.getStatus() == VehicleStatus.REJECTED) {
            throw new AppException(ErrorCode.VEHICLE_APPROVAL_REQUIRED);
        }

        // Khong cho set ve trang thai can admin xu ly.
        if (req.getStatus() == VehicleStatus.PENDING_APPROVAL || req.getStatus() == VehicleStatus.REJECTED) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        v.setStatus(req.getStatus());
        // không cần save(v) vì v đang managed trong transaction

        // Load ảnh riêng để tránh lazy + không đụng orphanRemoval
        List<VehicleImageEntity> imgs = vehicleImageRepository.findByVehicle_Id(v.getId());

        // Map response: dùng entity v + imgs
        return VehicleMapper.toResponseWithImages(v, imgs);
    }

    @Override
    @Transactional
    public List<VehicleImageResponse> addImages(Integer vehicleId, Integer ownerId, AddVehicleImagesRequest req) {

        VehicleEntity v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));
        assertOwner(v, ownerId);

        if (req == null || req.getImageUrls() == null || req.getImageUrls().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_KEY); // hoặc ErrorCode riêng: IMAGE_URLS_REQUIRED
        }

        boolean setFirstAsMain = Boolean.TRUE.equals(req.getSetFirstAsMain());

        // 1) Chuẩn hoá danh sách URL (trim + bỏ rỗng)
        List<String> urls = new java.util.ArrayList<>();
        for (String u : req.getImageUrls()) {
            if (u == null)
                continue;
            String s = u.trim();
            if (!s.isEmpty())
                urls.add(s);
        }
        if (urls.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        // 2) Neu yeu cau set main, clear main hien tai truoc khi them anh moi.
        if (setFirstAsMain) {
            List<VehicleImageEntity> current = vehicleImageRepository.findByVehicle_Id(vehicleId);
            boolean changed = false;
            for (VehicleImageEntity img : current) {
                if (Boolean.TRUE.equals(img.getIsMain())) {
                    img.setIsMain(false);
                    changed = true;
                }
            }
            if (changed) {
                vehicleImageRepository.saveAll(current);
            }
        }

        // 3) Tao batch image entity de luu mot lan.
        List<VehicleImageEntity> toSave = new java.util.ArrayList<>(urls.size());
        for (int i = 0; i < urls.size(); i++) {
            VehicleImageEntity img = VehicleImageEntity.builder()
                    .vehicle(v)
                    .imageUrl(urls.get(i))
                    .isMain(setFirstAsMain && i == 0) // chỉ ảnh đầu tiên là main nếu flag bật
                    .build();
            toSave.add(img);
        }
        vehicleImageRepository.saveAll(toSave);

        // 4) Tra ve danh sach anh moi nhat sau khi cap nhat.
        return VehicleMapper.toImageResponses(vehicleImageRepository.findByVehicle_Id(vehicleId));
    }

    @Override
    @Transactional
    public List<VehicleImageResponse> setMainImage(Integer vehicleId, Integer ownerId, Integer imageId) {
        VehicleEntity v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));
        assertOwner(v, ownerId);

        VehicleImageEntity target = vehicleImageRepository.findById(imageId)
                .orElseThrow(() -> new AppException(ErrorCode.IMAGE_NOT_FOUND));

        // Dam bao image thuoc dung vehicle de tranh cross-vehicle update.
        if (target.getVehicle() == null || !target.getVehicle().getId().equals(vehicleId)) {
            throw new AppException(ErrorCode.IMAGE_NOT_FOUND);
        }

        List<VehicleImageEntity> all = vehicleImageRepository.findByVehicle_Id(vehicleId);
        for (VehicleImageEntity img : all) {
            img.setIsMain(img.getId().equals(imageId));
        }
        vehicleImageRepository.saveAll(all);

        return VehicleMapper.toImageResponses(all);
    }

    @Override
    @Transactional
    public void deleteImage(Integer vehicleId, Integer ownerId, Integer imageId) {
        VehicleEntity v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));
        assertOwner(v, ownerId);

        VehicleImageEntity img = vehicleImageRepository.findById(imageId)
                .orElseThrow(() -> new AppException(ErrorCode.IMAGE_NOT_FOUND));

        // Chi xoa khi image thuoc vehicle dang thao tac.
        if (img.getVehicle() == null || !img.getVehicle().getId().equals(vehicleId)) {
            throw new AppException(ErrorCode.IMAGE_NOT_FOUND);
        }

        vehicleImageRepository.delete(img);
    }

    @Override
    @Transactional
    public List<VehicleImageResponse> uploadImages(
            Integer vehicleId,
            Integer ownerId,
            List<org.springframework.web.multipart.MultipartFile> files,
            Boolean setFirstAsMainFlag) {
        VehicleEntity v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));
        assertOwner(v, ownerId);

        if (files == null || files.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        boolean setFirstAsMain = Boolean.TRUE.equals(setFirstAsMainFlag);

        // Neu setFirstAsMain thi clear main hien tai, anh upload dau tien se la main.
        if (setFirstAsMain) {
            List<VehicleImageEntity> current = vehicleImageRepository.findByVehicle_Id(vehicleId);
            boolean changed = false;
            for (VehicleImageEntity img : current) {
                if (Boolean.TRUE.equals(img.getIsMain())) {
                    img.setIsMain(false);
                    changed = true;
                }
            }
            if (changed)
                vehicleImageRepository.saveAll(current);
        }

        // Upload file len cloud, lay URL va persist xuong DB.
        List<VehicleImageEntity> toSave = new java.util.ArrayList<>(files.size());
        for (int i = 0; i < files.size(); i++) {
            org.springframework.web.multipart.MultipartFile f = files.get(i);

            String url = cloudinaryService.uploadVehicleImage(f, vehicleId);

            VehicleImageEntity img = VehicleImageEntity.builder()
                    .vehicle(v)
                    .imageUrl(url)
                    .isMain(setFirstAsMain && i == 0)
                    .build();
            toSave.add(img);
        }

        vehicleImageRepository.saveAll(toSave);

        return VehicleMapper.toImageResponses(vehicleImageRepository.findByVehicle_Id(vehicleId));
    }

    @Override
    @Transactional(readOnly = true)
    public AvailabilityResponse checkAvailability(Integer vehicleId, LocalDateTime from, LocalDateTime to) {
        // Check vehicle exists
        if (!vehicleRepository.existsById(vehicleId)) {
            throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);
        }

        // Check for conflicts with CONFIRMED or ONGOING bookings
        List<BookingStatus> activeStatuses = Arrays.asList(
                BookingStatus.CONFIRMED,
                BookingStatus.ONGOING);

        List<BookingEntity> conflicts = bookingRepository.findOverlappingBookings(
                vehicleId, from, to, activeStatuses);

        boolean available = conflicts.isEmpty();
        String reason = available ? "Available" : "Vehicle is already booked for this period";

        return AvailabilityResponse.builder()
                .vehicleId(vehicleId)
                .available(available)
                .reason(reason)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleCalendarResponse getVehicleCalendar(Integer vehicleId, LocalDateTime from, LocalDateTime to) {
        // Check vehicle exists
        if (!vehicleRepository.existsById(vehicleId)) {
            throw new AppException(ErrorCode.VEHICLE_NOT_FOUND);
        }

        // Get all bookings (not just CONFIRMED/ONGOING, include PENDING too)
        List<BookingStatus> visibleStatuses = Arrays.asList(
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
                BookingStatus.ONGOING);

        List<BookingEntity> bookings = bookingRepository.findOverlappingBookings(
                vehicleId, from, to, visibleStatuses);

        List<BookedPeriodResponse> bookedPeriods = bookings.stream()
                .map(booking -> BookedPeriodResponse.builder()
                        .bookingId(booking.getId())
                        .startDate(booking.getStartDate())
                        .endDate(booking.getEndDate())
                        .status(booking.getStatus())
                        .build())
                .collect(Collectors.toList());

        return VehicleCalendarResponse.builder()
                .vehicleId(vehicleId)
                .bookedPeriods(bookedPeriods)
                .build();
    }

    private void assertOwner(VehicleEntity v, Integer ownerId) {
        Integer realOwnerId = (v.getOwner() != null ? v.getOwner().getId() : null);
        if (realOwnerId == null || !realOwnerId.equals(ownerId)) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }
    }

    @Override
    @Transactional
    public VehicleResponse approveVehicle(Integer vehicleId) {
        VehicleEntity v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

        // Load ảnh riêng để tránh thay thế collection managed (orphanRemoval)
        List<VehicleImageEntity> imgs = vehicleImageRepository.findByVehicle_Id(v.getId());

        // Neu da duyet truoc do thi tra ngay ket qua hien tai.
        if (v.getStatus() == com.example.car_management.entity.enums.VehicleStatus.AVAILABLE) {
            return VehicleMapper.toResponse(v, imgs);
        }

        // Chi duyet duoc xe dang PENDING_APPROVAL.
        if (v.getStatus() != com.example.car_management.entity.enums.VehicleStatus.PENDING_APPROVAL) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        // Chot duyet: cap nhat trang thai, thoi diem duyet va thong bao cho chu xe.
        v.setStatus(com.example.car_management.entity.enums.VehicleStatus.AVAILABLE);
        v.setReviewedAt(Instant.now());
        notificationService.notifyOwnerVehicleApproved(v);
        return VehicleMapper.toResponse(v, imgs);
    }

    @Override
    @Transactional
    public VehicleResponse rejectVehicle(Integer vehicleId, String reason) {
        VehicleEntity v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

        // Load ảnh riêng để tránh thay thế collection managed (orphanRemoval)
        List<VehicleImageEntity> imgs = vehicleImageRepository.findByVehicle_Id(v.getId());

        // Chi tu choi duoc xe dang cho duyet.
        if (v.getStatus() != com.example.car_management.entity.enums.VehicleStatus.PENDING_APPROVAL) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        // BE chưa có field lưu "reason"; chỉ set trạng thái.
        v.setStatus(com.example.car_management.entity.enums.VehicleStatus.REJECTED);
        v.setReviewedAt(Instant.now());
        notificationService.notifyOwnerVehicleRejected(v, reason);

        return VehicleMapper.toResponse(v, imgs);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleResponse> searchVehicles(VehicleSearchRequest req) {
        if (req.getFrom() == null || req.getTo() == null || !req.getTo().isAfter(req.getFrom())) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        String keyword = (req.getAddress() == null) ? null : req.getAddress().trim();

        List<BookingStatus> active = Arrays.asList(
                BookingStatus.PENDING,
                BookingStatus.CONFIRMED,
                BookingStatus.ONGOING);

        List<VehicleEntity> list = vehicleRepository.searchAvailableVehiclesSimple(
                com.example.car_management.entity.enums.VehicleStatus.AVAILABLE,
                keyword,
                req.getFrom(),
                req.getTo(),
                active);

        return list.stream().map(v -> {
            v.setImages(vehicleImageRepository.findByVehicle_Id(v.getId()));
            return VehicleMapper.toResponse(v);
        }).collect(Collectors.toList());
    }

    private Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            Object claim = jwt.getClaims().get("userId");
            if (claim instanceof Number number) {
                return number.intValue();
            }
            if (claim != null) {
                return Integer.valueOf(String.valueOf(claim));
            }
        }

        if (principal instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED))
                    .getId();
        }

        String name = authentication.getName();
        if (name != null && !name.isBlank()) {
            return userRepository.findByEmail(name)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED))
                    .getId();
        }

        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }
}
