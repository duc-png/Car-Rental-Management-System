package com.example.car_management.service.impl;

import com.example.car_management.dto.response.OwnerProfileResponse;
import com.example.car_management.dto.response.OwnerPublicProfileResponse;
import com.example.car_management.dto.response.OwnerReceivedReviewResponse;
import com.example.car_management.dto.response.VehicleResponse;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.entity.VehicleReviewEntity;
import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.mapper.VehicleMapper;
import com.example.car_management.repository.BookingRepository;
import com.example.car_management.repository.UserRepository;
import com.example.car_management.repository.VehicleImageRepository;
import com.example.car_management.repository.VehicleRepository;
import com.example.car_management.repository.VehicleReviewRepository;
import com.example.car_management.service.OwnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OwnerServiceImpl implements OwnerService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleImageRepository vehicleImageRepository;
    private final VehicleReviewRepository reviewRepository;

    @Override
    @Transactional(readOnly = true)
    public List<OwnerProfileResponse> listOwners(Integer page, Integer size, String q) {
        int p = (page == null || page < 0) ? 0 : page;
        int s = (size == null || size <= 0) ? 20 : size;

        Pageable pageable = PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "id"));

        // BE đang dùng CAR_OWNER
        Page<UserEntity> owners = (q == null || q.trim().isEmpty())
                ? userRepository.findByRole("OWNER", pageable)
                : userRepository.searchByRole("OWNER", q.trim(), pageable);

        return owners.getContent().stream().map(this::toProfile).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerProfileResponse getOwnerProfile(Integer ownerId) {
        UserEntity owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return toProfile(owner);
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerPublicProfileResponse getOwnerPublicProfile(Integer ownerId) {
        UserEntity owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        OwnerProfileResponse ownerProfile = toProfile(owner);

        List<VehicleResponse> vehicles = vehicleRepository.findByOwner_Id(ownerId)
                .stream()
                .map(this::toVehicleResponse)
                .collect(Collectors.toList());

        List<OwnerReceivedReviewResponse> receivedReviews = reviewRepository.findReceivedReviewsByOwner(ownerId)
                .stream()
                .map(this::toReceivedReviewResponse)
                .collect(Collectors.toList());

        return OwnerPublicProfileResponse.builder()
                .owner(ownerProfile)
                .vehicles(vehicles)
                .receivedReviews(receivedReviews)
                .build();
    }

    private VehicleResponse toVehicleResponse(VehicleEntity vehicle) {
        return VehicleMapper.toResponse(vehicle, vehicleImageRepository.findByVehicle_Id(vehicle.getId()));
    }

    private OwnerReceivedReviewResponse toReceivedReviewResponse(VehicleReviewEntity review) {
        Integer vehicleId = review.getBooking() != null && review.getBooking().getVehicle() != null
                ? review.getBooking().getVehicle().getId()
                : null;

        String vehicleName = null;
        if (review.getBooking() != null && review.getBooking().getVehicle() != null) {
            VehicleEntity vehicle = review.getBooking().getVehicle();
            String brandName = (vehicle.getModel() != null && vehicle.getModel().getBrand() != null)
                    ? vehicle.getModel().getBrand().getName()
                    : null;
            String modelName = (vehicle.getModel() != null)
                    ? vehicle.getModel().getName()
                    : null;
            vehicleName = (brandName == null ? "" : brandName + " ") + (modelName == null ? "" : modelName);
            vehicleName = vehicleName.trim();
            if (vehicleName.isEmpty()) {
                vehicleName = null;
            }
        }

        return OwnerReceivedReviewResponse.builder()
                .reviewId(review.getId())
                .bookingId(review.getBooking() != null ? review.getBooking().getId() : null)
                .vehicleId(vehicleId)
                .vehicleName(vehicleName)
                .reviewerId(review.getBooking() != null && review.getBooking().getCustomer() != null
                        ? review.getBooking().getCustomer().getId()
                        : null)
                .reviewerName(review.getBooking() != null && review.getBooking().getCustomer() != null
                        ? review.getBooking().getCustomer().getFullName()
                        : null)
                .vehicleRating(review.getVehicleRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }

    private OwnerProfileResponse toProfile(UserEntity owner) {
        Object[] stats = reviewRepository.getOwnerRatingStats(owner.getId());
        double avg = 0;
        long reviews = 0;
        if (stats != null && stats.length >= 2) {
            avg = stats[0] == null ? 0 : ((Number) stats[0]).doubleValue();
            reviews = stats[1] == null ? 0 : ((Number) stats[1]).longValue();
        }

        long trips = bookingRepository.countOwnerTripsByStatus(owner.getId(), BookingStatus.COMPLETED);

        return OwnerProfileResponse.builder()
                .ownerId(owner.getId())
                .fullName(owner.getFullName())
                .phone(owner.getPhone())
                .email(owner.getEmail())
                .isVerified(owner.getIsVerified())
                .avgRating(round1(avg))
                .totalReviews(reviews)
                .totalTrips(trips)
                .build();
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }
}
