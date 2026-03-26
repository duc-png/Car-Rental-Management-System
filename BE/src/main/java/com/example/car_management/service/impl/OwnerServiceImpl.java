package com.example.car_management.service.impl;

import com.example.car_management.dto.response.OwnerProfileResponse;
import com.example.car_management.dto.response.OwnerPerformanceResponse;
import com.example.car_management.dto.response.OwnerPublicProfileResponse;
import com.example.car_management.dto.response.OwnerReceivedReviewResponse;
import com.example.car_management.dto.response.VehicleResponse;
import com.example.car_management.dto.request.UpdateCustomerStatusRequest;
import com.example.car_management.entity.ChatConversationEntity;
import com.example.car_management.entity.ChatMessageEntity;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.entity.VehicleReviewEntity;
import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.entity.enums.OwnerRegistrationStatus;
import com.example.car_management.entity.enums.UserRole;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.mapper.VehicleMapper;
import com.example.car_management.repository.BookingRepository;
import com.example.car_management.repository.ChatConversationRepository;
import com.example.car_management.repository.ChatMessageRepository;
import com.example.car_management.repository.OwnerRegistrationRepository;
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

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OwnerServiceImpl implements OwnerService {

        private final UserRepository userRepository;
        private final OwnerRegistrationRepository ownerRegistrationRepository;
        private final BookingRepository bookingRepository;
        private final VehicleRepository vehicleRepository;
        private final VehicleImageRepository vehicleImageRepository;
        private final VehicleReviewRepository reviewRepository;
        private final ChatConversationRepository chatConversationRepository;
        private final ChatMessageRepository chatMessageRepository;

        @Override
        @Transactional(readOnly = true)
        public List<OwnerProfileResponse> listOwners(Integer page, Integer size, String q) {
                int p = (page == null || page < 0) ? 0 : page;
                int s = (size == null || size <= 0) ? 20 : size;

                Pageable pageable = PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "id"));

                // BE đang dùng CAR_OWNER
                Page<UserEntity> owners = (q == null || q.trim().isEmpty())
                                ? userRepository.findByRole(UserRole.CAR_OWNER, pageable)
                                : userRepository.searchByRole(UserRole.CAR_OWNER, q.trim(), pageable);

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
        public OwnerPerformanceResponse getOwnerPerformance(Integer ownerId) {
                UserEntity owner = userRepository.findById(ownerId)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

                OwnerProfileResponse profile = toProfile(owner);
                return OwnerPerformanceResponse.builder()
                                .ownerId(profile.getOwnerId())
                                .avgRating(profile.getAvgRating())
                                .totalReviews(profile.getTotalReviews())
                                .totalTrips(profile.getTotalTrips())
                                .responseRate(profile.getResponseRate())
                                .responseTimeMinutes(profile.getResponseTimeMinutes())
                                .approvalRate(profile.getApprovalRate())
                                .build();
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

        @Override
        @Transactional
        public OwnerProfileResponse updateOwnerStatus(Integer ownerId, UpdateCustomerStatusRequest request) {
                UserEntity owner = userRepository.findById(ownerId)
                                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

                if (owner.getRoleId() != UserRole.CAR_OWNER) {
                        throw new AppException(ErrorCode.UNAUTHORIZED);
                }

                if (request != null && request.getIsActive() != null) {
                        owner.setIsActive(request.getIsActive());
                        owner = userRepository.save(owner);
                }

                return toProfile(owner);
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

                long totalOwnerBookings = bookingRepository.countOwnerBookings(owner.getId());
                long approvedOwnerBookings = bookingRepository.countOwnerBookingsByStatuses(
                                owner.getId(),
                                List.of(BookingStatus.CONFIRMED, BookingStatus.ONGOING, BookingStatus.COMPLETED));
                int approvalRate = totalOwnerBookings > 0
                                ? (int) Math.round((approvedOwnerBookings * 100.0) / totalOwnerBookings)
                                : 0;

                ResponseMetrics responseMetrics = calculateResponseMetrics(owner.getId());

                var approvedRegistration = ownerRegistrationRepository
                                .findFirstByApprovedOwner_IdAndStatusOrderByReviewedAtAsc(owner.getId(),
                                                OwnerRegistrationStatus.APPROVED)
                                .orElse(null);

                var joinedAt = approvedRegistration != null && approvedRegistration.getReviewedAt() != null
                                ? approvedRegistration.getReviewedAt()
                                : owner.getCreatedAt();

                return OwnerProfileResponse.builder()
                                .ownerId(owner.getId())
                                .fullName(owner.getFullName())
                                .phone(owner.getPhone())
                                .email(owner.getEmail())
                                .avatar(owner.getAvatar())
                                .isVerified(owner.getIsVerified())
                                .isActive(owner.getIsActive() == null || owner.getIsActive())
                                .joinedAt(joinedAt)
                                .avgRating(round1(avg))
                                .totalReviews(reviews)
                                .totalTrips(trips)
                                .responseRate(responseMetrics.responseRate())
                                .responseTimeMinutes(responseMetrics.responseTimeMinutes())
                                .approvalRate(approvalRate)
                                .build();
        }

        private ResponseMetrics calculateResponseMetrics(Integer ownerId) {
                List<ChatConversationEntity> conversations = chatConversationRepository.findByOwnerId(ownerId);
                if (conversations.isEmpty()) {
                        return new ResponseMetrics(0, 0);
                }

                List<ChatMessageEntity> messages = chatMessageRepository
                                .findByConversation_Owner_IdOrderByConversation_IdAscCreatedAtAsc(ownerId);
                if (messages.isEmpty()) {
                        return new ResponseMetrics(0, 0);
                }

                Map<Integer, Integer> conversationCustomerIdMap = conversations.stream()
                                .collect(Collectors.toMap(
                                                ChatConversationEntity::getId,
                                                c -> c.getCustomer() != null ? c.getCustomer().getId() : null,
                                                (left, right) -> left,
                                                HashMap::new));

                Map<Integer, Instant> firstCustomerMessageAt = new HashMap<>();
                Map<Integer, Instant> firstOwnerReplyAt = new HashMap<>();

                for (ChatMessageEntity message : messages) {
                        Integer conversationId = message.getConversation() != null ? message.getConversation().getId()
                                        : null;
                        Integer senderId = message.getSender() != null ? message.getSender().getId() : null;
                        Instant createdAt = message.getCreatedAt();

                        if (conversationId == null || senderId == null || createdAt == null) {
                                continue;
                        }

                        Integer customerId = conversationCustomerIdMap.get(conversationId);
                        if (customerId == null) {
                                continue;
                        }

                        if (senderId.equals(customerId)) {
                                firstCustomerMessageAt.putIfAbsent(conversationId, createdAt);
                                continue;
                        }

                        if (!senderId.equals(ownerId)) {
                                continue;
                        }

                        Instant customerFirstAt = firstCustomerMessageAt.get(conversationId);
                        if (customerFirstAt == null) {
                                continue;
                        }

                        if (createdAt.isAfter(customerFirstAt)) {
                                firstOwnerReplyAt.putIfAbsent(conversationId, createdAt);
                        }
                }

                long conversationsWithCustomerMessage = firstCustomerMessageAt.size();
                long respondedConversations = firstOwnerReplyAt.size();

                int responseRate = conversationsWithCustomerMessage > 0
                                ? (int) Math.round((respondedConversations * 100.0) / conversationsWithCustomerMessage)
                                : 0;

                long totalResponseMinutes = 0;
                long responseSamples = 0;
                for (Map.Entry<Integer, Instant> entry : firstOwnerReplyAt.entrySet()) {
                        Integer conversationId = entry.getKey();
                        Instant ownerFirstReplyAt = entry.getValue();
                        Instant customerFirstAt = firstCustomerMessageAt.get(conversationId);
                        if (ownerFirstReplyAt == null || customerFirstAt == null) {
                                continue;
                        }

                        long minutes = Duration.between(customerFirstAt, ownerFirstReplyAt).toMinutes();
                        if (minutes < 0) {
                                continue;
                        }

                        totalResponseMinutes += minutes;
                        responseSamples += 1;
                }

                int responseTimeMinutes = responseSamples > 0
                                ? (int) Math.round(totalResponseMinutes / (double) responseSamples)
                                : 0;

                return new ResponseMetrics(responseRate, responseTimeMinutes);
        }

        private record ResponseMetrics(int responseRate, int responseTimeMinutes) {
        }

        private double round1(double v) {
                return Math.round(v * 10.0) / 10.0;
        }
}
