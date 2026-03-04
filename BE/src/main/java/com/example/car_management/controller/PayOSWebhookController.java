package com.example.car_management.controller;

import com.example.car_management.entity.BookingEntity;
import com.example.car_management.entity.PaymentEntity;
import com.example.car_management.entity.enums.PaymentMethod;
import com.example.car_management.entity.enums.PaymentStatus;
import com.example.car_management.entity.enums.TransactionStatus;
import com.example.car_management.repository.BookingRepository;
import com.example.car_management.repository.PaymentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PayOSWebhookController {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

    @PostMapping("/payos-webhook")
    public ResponseEntity<String> receiveWebhook(@RequestBody JsonNode body) {
        try {
            // Check if webhook indicates failure
            if (body.has("success") && !body.get("success").asBoolean()) {
                return ResponseEntity.ok("Received failed webhook");
            }

            // Extract order code from webhook data
            JsonNode dataNode = body.get("data");
            if (dataNode == null) {
                log.error("Webhook data is missing");
                return ResponseEntity.ok("Missing data");
            }

            Long orderCode = dataNode.has("orderCode") ? dataNode.get("orderCode").asLong() : null;
            if (orderCode == null) {
                log.error("Missing orderCode in webhook data");
                return ResponseEntity.ok("Missing orderCode");
            }

            // Find booking by orderCode using indexed query
            Optional<BookingEntity> bookingOpt = bookingRepository.findByPayosOrderCode(orderCode);

            if (bookingOpt.isPresent()) {
                BookingEntity booking = bookingOpt.get();

                // If it's a deposit payment (15%)
                if (orderCode.equals(booking.getPayosDepositOrderCode())) {
                    if (booking.getPaymentStatus() == PaymentStatus.PENDING_DEPOSIT) {
                        booking.setPaymentStatus(PaymentStatus.DEPOSIT_PAID);
                        bookingRepository.save(booking);

                        // Luu record vao bang payments
                        BigDecimal depositAmount = booking.getDepositAmount() != null
                                ? booking.getDepositAmount()
                                : booking.getTotalPrice().multiply(BigDecimal.valueOf(0.15));
                        paymentRepository.save(PaymentEntity.builder()
                                .booking(booking)
                                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                                .amount(depositAmount)
                                .transactionId(String.valueOf(orderCode))
                                .status(TransactionStatus.SUCCESS)
                                .paymentDate(Instant.now())
                                .build());
                        log.info("Deposit payment recorded for booking #{}: {} VND",
                                booking.getId(), depositAmount);
                    }
                }
                // If it's the full payment (85%)
                else if (orderCode.equals(booking.getPayosFullOrderCode())) {
                    if (booking.getPaymentStatus() == PaymentStatus.PENDING_FULL_PAYMENT) {
                        booking.setPaymentStatus(PaymentStatus.FULLY_PAID);
                        bookingRepository.save(booking);

                        // Luu record vao bang payments
                        BigDecimal remainingAmount = booking.getTotalPrice().multiply(BigDecimal.valueOf(0.85));
                        paymentRepository.save(PaymentEntity.builder()
                                .booking(booking)
                                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                                .amount(remainingAmount)
                                .transactionId(String.valueOf(orderCode))
                                .status(TransactionStatus.SUCCESS)
                                .paymentDate(Instant.now())
                                .build());
                        log.info("Full payment recorded for booking #{}: {} VND",
                                booking.getId(), remainingAmount);
                    }
                }
            } else {
                log.warn("Received webhook for unknown order code: {}", orderCode);
            }

            return ResponseEntity.ok("success");

        } catch (Exception e) {
            log.error("Error processing PayOS webhook", e);
            return ResponseEntity.ok("failure"); // Returning 200 OK so PayOS stops retrying, but log error
        }
    }
}
