package com.example.car_management.service;

import com.example.car_management.dto.request.CreateCustomerRequest;
import com.example.car_management.dto.request.UpdateCustomerRequest;
import com.example.car_management.dto.request.UpdateCustomerStatusRequest;
import com.example.car_management.dto.response.CustomerResponse;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.enums.UserRole;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.repository.BookingRepository;
import com.example.car_management.repository.CustomerBookingSummary;
import com.example.car_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;

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

        return customers.stream()
                .map(customer -> toResponse(customer, summaryMap.get(customer.getId())))
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
                .licenseNumber(request.getLicenseNumber())
                .address(request.getAddress())
                .password(passwordEncoder.encode(rawPassword))
                .roleId(UserRole.USER)
                .isVerified(Boolean.TRUE)
                .isActive(Boolean.TRUE)
                .createdAt(Instant.now())
                .build();

        UserEntity saved = userRepository.save(user);

        return toResponse(saved, null);
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
        user.setLicenseNumber(request.getLicenseNumber());
        user.setAddress(request.getAddress());

        UserEntity saved = userRepository.save(user);

        CustomerBookingSummary summary = bookingRepository.summarizeByCustomerIds(List.of(saved.getId()))
                .stream()
                .findFirst()
                .orElse(null);

        return toResponse(saved, summary);
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

        return toResponse(saved, summary);
    }

    private CustomerResponse toResponse(UserEntity user, CustomerBookingSummary summary) {
        Long totalBookings = summary != null ? summary.getTotalBookings() : 0L;
        BigDecimal totalRevenue = summary != null ? summary.getTotalRevenue() : BigDecimal.ZERO;

        return CustomerResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .licenseNumber(user.getLicenseNumber())
                .address(user.getAddress())
                .isActive(user.getIsActive() == null || user.getIsActive())
                .createdAt(user.getCreatedAt())
                .totalBookings(totalBookings)
                .totalRevenue(totalRevenue)
                .build();
    }

    private String generateTempPassword() {
        return "Cust@" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }
}
