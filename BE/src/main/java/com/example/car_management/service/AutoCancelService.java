package com.example.car_management.service;

import com.example.car_management.entity.BookingEntity;
import com.example.car_management.entity.enums.BookingStatus;
import com.example.car_management.entity.enums.PaymentStatus;
import com.example.car_management.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AutoCancelService {

    private final BookingRepository bookingRepository;

    // Run every 1 minute
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cancelUnpaidDepositBookings() {
        log.info("Running scheduled job to cancel unpaid deposit bookings...");

        // 15 minutes ago
        Instant expiryTime = Instant.now().minus(15, ChronoUnit.MINUTES);

        List<BookingEntity> expiredBookings = bookingRepository.findByStatusAndPaymentStatusAndUpdatedAtBefore(
                BookingStatus.CONFIRMED,
                PaymentStatus.PENDING_DEPOSIT,
                expiryTime);

        if (!expiredBookings.isEmpty()) {
            log.info("Found {} bookings to cancel due to unpaid deposit.", expiredBookings.size());
            for (BookingEntity booking : expiredBookings) {
                booking.setStatus(BookingStatus.CANCELLED);
                booking.setUpdatedAt(Instant.now());
                log.info("Cancelled booking ID: {}", booking.getId());
            }
            bookingRepository.saveAll(expiredBookings);
        }
    }
}
