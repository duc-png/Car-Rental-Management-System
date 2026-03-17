package com.example.car_management.service;

import com.example.car_management.dto.request.CreateVoucherRequest;
import com.example.car_management.dto.response.VoucherResponse;
import com.example.car_management.entity.VoucherEntity;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.repository.VoucherRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VoucherService {

    VoucherRepository voucherRepository;

    static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    static final int CODE_LENGTH = 8;
    static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Generate a unique 8-character alphanumeric voucher code.
     */
    @Transactional(readOnly = true)
    public String generateUniqueCode() {
        String code;
        int attempts = 0;
        do {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
            }
            code = sb.toString();
            attempts++;
            if (attempts > 100) {
                throw new RuntimeException("Unable to generate unique voucher code after 100 attempts");
            }
        } while (voucherRepository.findByCode(code).isPresent());

        return code;
    }

    /**
     * Create a new voucher (admin only).
     */
    @Transactional
    public VoucherResponse createVoucher(CreateVoucherRequest request) {
        String code = request.getCode().toUpperCase();

        if (request.getDiscountPercent().compareTo(new BigDecimal("30")) > 0) {
            throw new AppException(ErrorCode.VOUCHER_DISCOUNT_EXCEEDED);
        }

        if (voucherRepository.findByCode(code).isPresent()) {
            throw new AppException(ErrorCode.VOUCHER_CODE_EXISTED);
        }

        VoucherEntity voucher = VoucherEntity.builder()
                .code(code)
                .discountPercent(request.getDiscountPercent())
                .quantity(request.getQuantity())
                .usedCount(0)
                .active(true)
                .createdAt(Instant.now())
                .build();

        voucherRepository.save(voucher);

        log.info("Voucher created: code={}, discount={}%, quantity={}",
                voucher.getCode(), voucher.getDiscountPercent(), voucher.getQuantity());

        return VoucherResponse.builder()
                .code(voucher.getCode())
                .discountPercent(voucher.getDiscountPercent())
                .remainingUses(voucher.getQuantity())
                .valid(true)
                .build();
    }

    /**
     * Validate a voucher code without consuming it.
     */
    @Transactional(readOnly = true)
    public VoucherResponse validateVoucher(String code) {
        VoucherEntity voucher = voucherRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        boolean isValid = voucher.getActive()
                && voucher.getUsedCount() < voucher.getQuantity();

        int remaining = Math.max(0, voucher.getQuantity() - voucher.getUsedCount());

        return VoucherResponse.builder()
                .code(voucher.getCode())
                .discountPercent(voucher.getDiscountPercent())
                .remainingUses(remaining)
                .valid(isValid)
                .build();
    }

    /**
     * Apply a voucher: validate + increment usedCount.
     * Returns the discount percent (e.g. 10 or 15).
     */
    @Transactional
    public BigDecimal applyVoucher(String code) {
        VoucherEntity voucher = voucherRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_FOUND));

        if (!voucher.getActive()) {
            throw new AppException(ErrorCode.VOUCHER_INVALID);
        }

        if (voucher.getUsedCount() >= voucher.getQuantity()) {
            throw new AppException(ErrorCode.VOUCHER_ALREADY_USED);
        }

        voucher.setUsedCount(voucher.getUsedCount() + 1);
        voucherRepository.save(voucher);

        log.info("Voucher {} applied. Used {}/{}", voucher.getCode(),
                voucher.getUsedCount(), voucher.getQuantity());

        return voucher.getDiscountPercent();
    }
}

