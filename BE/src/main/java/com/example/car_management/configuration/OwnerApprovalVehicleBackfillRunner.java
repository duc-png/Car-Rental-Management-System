package com.example.car_management.configuration;

import com.example.car_management.entity.LocationEntity;
import com.example.car_management.entity.OwnerRegistration;
import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.entity.enums.OwnerRegistrationStatus;
import com.example.car_management.entity.enums.VehicleStatus;
import com.example.car_management.repository.LocationRepository;
import com.example.car_management.repository.OwnerRegistrationRepository;
import com.example.car_management.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class OwnerApprovalVehicleBackfillRunner implements ApplicationRunner {

    private final OwnerRegistrationRepository ownerRegistrationRepository;
    private final VehicleRepository vehicleRepository;
    private final LocationRepository locationRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<OwnerRegistration> approved = ownerRegistrationRepository
                .findAllByStatusOrderByCreatedAtDesc(OwnerRegistrationStatus.APPROVED);

        int statusFixed = 0;
        int locationFixed = 0;

        for (OwnerRegistration registration : approved) {
            if (registration.getLicensePlate() == null || registration.getLicensePlate().trim().isEmpty()) {
                continue;
            }

            VehicleEntity vehicle = vehicleRepository.findByLicensePlate(registration.getLicensePlate().trim())
                    .orElse(null);
            if (vehicle == null) {
                continue;
            }

            if (vehicle.getStatus() == VehicleStatus.PENDING_APPROVAL) {
                vehicle.setStatus(VehicleStatus.AVAILABLE);
                statusFixed++;
            }

            if (vehicle.getLocation() == null && registration.getAddressDetail() != null
                    && !registration.getAddressDetail().trim().isEmpty()) {
                vehicle.setLocation(resolveLocation(registration.getAddressDetail()));
                locationFixed++;
            }
        }

        if (statusFixed > 0 || locationFixed > 0) {
            log.info("Owner-approval backfill completed: statusFixed={}, locationFixed={}", statusFixed, locationFixed);
        }
    }

    private LocationEntity resolveLocation(String addressDetailRaw) {
        String normalizedAddress = normalizeAddressDetail(addressDetailRaw);
        List<String> parts = Arrays.stream(normalizedAddress.split(","))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .toList();

        String city = truncate(parts.isEmpty() ? normalizedAddress : parts.get(parts.size() - 1), 100);
        String district = truncate(parts.size() >= 2 ? parts.get(parts.size() - 2) : city, 100);
        String addressDetail = truncate(normalizedAddress, 255);

        return locationRepository.save(LocationEntity.builder()
                .city(city == null || city.isBlank() ? "Chưa rõ" : city)
                .district(district == null || district.isBlank() ? (city == null || city.isBlank() ? "Chưa rõ" : city)
                        : district)
                .addressDetail(addressDetail)
                .build());
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
}
