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
import com.example.car_management.service.VehicleService;
import com.example.car_management.service.cloud.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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

    @Override
    @Transactional
    public VehicleResponse createVehicle(CreateVehicleRequest req) {

        if (vehicleRepository.existsByLicensePlate(req.getLicensePlate())) {
            throw new AppException(ErrorCode.LICENSE_PLATE_EXISTED);
        }

        UserEntity owner = userRepository.findById(req.getOwnerId())
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
                .location(location)
                .features(resolveFeatures(req.getFeatureIds()))
                .build();

        VehicleEntity saved = vehicleRepository.save(v);
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

        assertOwner(v, ownerId);

        if (req.getLicensePlate() != null && !v.getLicensePlate().equals(req.getLicensePlate())
                && vehicleRepository.existsByLicensePlate(req.getLicensePlate())) {
            throw new AppException(ErrorCode.LICENSE_PLATE_EXISTED);
        }

        if (req.getModelId() != null) {
            VehicleModelEntity model = vehicleModelRepository.findByIdWithBrandAndType(req.getModelId())
                    .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_MODEL_NOT_FOUND));
            v.setModel(model);
        }

        if (req.getLicensePlate() != null)
            v.setLicensePlate(req.getLicensePlate());
        if (req.getColor() != null)
            v.setColor(req.getColor());
        if (req.getSeatCount() != null)
            v.setSeatCount(req.getSeatCount());
        if (req.getTransmission() != null)
            v.setTransmission(req.getTransmission());
        if (req.getFuelType() != null)
            v.setFuelType(req.getFuelType());
        if (req.getPricePerDay() != null)
            v.setPricePerDay(req.getPricePerDay());
        if (req.getDescription() != null)
            v.setDescription(req.getDescription().trim());
        if (req.getYear() != null)
            v.setYear(req.getYear());
        if (req.getFuelConsumption() != null)
            v.setFuelConsumption(req.getFuelConsumption());
        if (req.getCurrentKm() != null)
            v.setCurrentKm(req.getCurrentKm());
        if (req.getStatus() != null) {
            throw new AppException(ErrorCode.VEHICLE_APPROVAL_REQUIRED);
        }
        if (req.getFeatureIds() != null)
            v.setFeatures(resolveFeatures(req.getFeatureIds()));

        // Update location chỉ nếu có locationId hoặc location data được gửi
        boolean hasLocationIdOrData = req.getLocationId() != null
                || (req.getLocation() != null && hasAnyLocationData(req.getLocation()));
        if (hasLocationIdOrData) {
            LocationEntity location = resolveLocationForUpdate(req.getLocationId(), req.getLocation(), v.getLocation());
            v.setLocation(location);
        }

        VehicleEntity saved = vehicleRepository.save(v);

        // chỉ load images để map response, KHÔNG set vào entity
        List<VehicleImageEntity> imgs = vehicleImageRepository.findByVehicle_Id(saved.getId());
        return VehicleMapper.toResponse(saved, imgs);
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
            return null; // Return null để giữ location cũ (sẽ không set nếu null)
        }

        // Nếu có location input, tạo/update location
        LocationEntity location = LocationEntity.builder()
                .city(locationInput.getProvince() != null ? locationInput.getProvince().trim() : null)
                .district(locationInput.getWard() != null ? locationInput.getWard().trim() : null)
                .addressDetail(
                        locationInput.getAddressDetail() != null ? locationInput.getAddressDetail().trim() : null)
                .build();

        return locationRepository.save(location);
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
                .city(locationInput.getProvince() != null ? locationInput.getProvince().trim() : null)
                .district(locationInput.getWard() != null ? locationInput.getWard().trim() : null)
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

        if (v.getStatus() == VehicleStatus.PENDING_APPROVAL || v.getStatus() == VehicleStatus.REJECTED) {
            throw new AppException(ErrorCode.VEHICLE_APPROVAL_REQUIRED);
        }

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

        // 2) Nếu setFirstAsMain => clear main hiện tại
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

        // 3) Tạo entity và save batch (nhanh hơn save từng cái)
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

        // 4) Trả response
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

        // nếu setFirstAsMain => clear main hiện tại
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

        // upload cloudinary -> lấy URL -> lưu DB
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

        if (v.getStatus() == com.example.car_management.entity.enums.VehicleStatus.AVAILABLE) {
            return VehicleMapper.toResponse(v, imgs);
        }

        if (v.getStatus() != com.example.car_management.entity.enums.VehicleStatus.PENDING_APPROVAL) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        v.setStatus(com.example.car_management.entity.enums.VehicleStatus.AVAILABLE);
        v.setReviewedAt(Instant.now());
        return VehicleMapper.toResponse(v, imgs);
    }

    @Override
    @Transactional
    public VehicleResponse rejectVehicle(Integer vehicleId, String reason) {
        VehicleEntity v = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

        // Load ảnh riêng để tránh thay thế collection managed (orphanRemoval)
        List<VehicleImageEntity> imgs = vehicleImageRepository.findByVehicle_Id(v.getId());

        if (v.getStatus() != com.example.car_management.entity.enums.VehicleStatus.PENDING_APPROVAL) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        // BE chưa có field lưu "reason"; chỉ set trạng thái.
        v.setStatus(com.example.car_management.entity.enums.VehicleStatus.REJECTED);
        v.setReviewedAt(Instant.now());

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
}
