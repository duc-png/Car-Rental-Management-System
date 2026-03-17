package com.example.car_management.service;

import com.example.car_management.entity.BookingEntity;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class PaymentService {

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    private final PayOS payOS;
    private static final BigDecimal MIN_PAYOS_AMOUNT = BigDecimal.valueOf(2000);

    public CreatePaymentLinkResponse createPaymentLink(BookingEntity booking, boolean isDeposit) {
        try {
            long orderCode = new Date().getTime(); // Unique ID for PayOS
            int price;
            String description;

            if (isDeposit) {
                // Calculate 15% deposit
                BigDecimal depositAmount = booking.getTotalPrice().multiply(BigDecimal.valueOf(0.15));
                price = depositAmount.intValue();
                description = "Coc xe " + booking.getVehicle().getLicensePlate();
                booking.setPayosDepositOrderCode(orderCode); // We will save this later in BookingService
            } else {
                // Calculate 85% remaining
                BigDecimal remainingAmount = booking.getTotalPrice().multiply(BigDecimal.valueOf(0.85));
                price = remainingAmount.intValue();
                description = "TTS xe " + booking.getVehicle().getLicensePlate();
                booking.setPayosFullOrderCode(orderCode);
            }

            // Ensure price is valid for PayOS (at least 2000 VND usually)
            if (price < 2000)
                price = 2000;

            // PayOS strictly requires description to contain only letters, numbers, and
            // spaces
            // (Regex: ^[a-zA-Z0-9 ]*$)
            description = description.replaceAll("[^a-zA-Z0-9 ]", "");

            // Limit description length (PayOS requires short description)
            if (description.length() > 25) {
                description = description.substring(0, 25);
            }

            PaymentLinkItem item = PaymentLinkItem.builder()
                    .name(isDeposit ? "Tien coc thue xe" : "Tien thue xe con lai")
                    .quantity(1)
                    .price(Long.valueOf(price))
                    .build();

            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(Long.valueOf(price))
                    .description(description)
                    .returnUrl(frontendUrl + "/booking/" + booking.getId() + "/payment-success")
                    .cancelUrl(frontendUrl + "/booking/" + booking.getId() + "/payment-cancel")
                    .item(item)
                    .build();

            return payOS.paymentRequests().create(paymentData);

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("Error creating payment link: " + e.getMessage());
            e.printStackTrace();
            throw new AppException(ErrorCode.PAYMENT_ERROR); // Replace with a better UNCATEGORIZED_EXCEPTION or
                                                             // PAYMENT_ERROR
        }
    }

    public CreatePaymentLinkResponse createPenaltyPaymentLink(BookingEntity booking, java.math.BigDecimal penaltyAmount) {
        try {
            long orderCode = new Date().getTime();
            if (penaltyAmount == null || penaltyAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new AppException(ErrorCode.INVALID_KEY);
            }

            BigDecimal normalizedPenaltyAmount = penaltyAmount.setScale(0, RoundingMode.HALF_UP);
            if (normalizedPenaltyAmount.compareTo(MIN_PAYOS_AMOUNT) < 0) {
                throw new AppException(ErrorCode.INVALID_KEY);
            }
            int price = normalizedPenaltyAmount.intValueExact();

            String description = ("Phi phat " + booking.getVehicle().getLicensePlate())
                    .replaceAll("[^a-zA-Z0-9 ]", "");
            if (description.length() > 25) {
                description = description.substring(0, 25);
            }

            PaymentLinkItem item = PaymentLinkItem.builder()
                    .name("Phi phat tra xe")
                    .quantity(1)
                    .price(Long.valueOf(price))
                    .build();

            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(Long.valueOf(price))
                    .description(description)
                    .returnUrl(frontendUrl + "/booking/" + booking.getId() + "/payment-success")
                    .cancelUrl(frontendUrl + "/booking/" + booking.getId() + "/payment-cancel")
                    .item(item)
                    .build();

            booking.setPayosPenaltyOrderCode(orderCode);

            return payOS.paymentRequests().create(paymentData);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("Error creating penalty payment link: " + e.getMessage());
            e.printStackTrace();
            throw new AppException(ErrorCode.PAYMENT_ERROR);
        }
    }
}
