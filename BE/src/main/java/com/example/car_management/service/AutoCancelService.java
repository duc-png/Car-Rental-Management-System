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

        // 2 hours ago — renter has 2 hours to pay deposit after booking is CONFIRMED
        Instant expiryTime = Instant.now().minus(2, ChronoUnit.HOURS);

        List<BookingEntity> expiredBookings = bookingRepository.findByStatusAndPaymentStatusAndUpdatedAtBefore(
                BookingStatus.CONFIRMED,
                PaymentStatus.PENDING_DEPOSIT,
                expiryTime);

        if (!expiredBookings.isEmpty()) {
            log.info("Found {} CONFIRMED bookings to cancel due to unpaid deposit.", expiredBookings.size());
            for (BookingEntity booking : expiredBookings) {
                booking.setStatus(BookingStatus.CANCELLED);
                booking.setUpdatedAt(Instant.now());
                log.info("Cancelled booking ID: {} (unpaid deposit timeout)", booking.getId());
            }
            bookingRepository.saveAll(expiredBookings);
        }
    }

    // Run every 5 minutes
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void cancelUnapprovedPendingBookings() {
        log.info("Running scheduled job to cancel unapproved PENDING bookings...");

        // 2 hours ago — owner has 2 hours to approve/reject before auto-cancel
        Instant expiryTime = Instant.now().minus(2, ChronoUnit.HOURS);

        List<BookingEntity> expiredPending = bookingRepository.findByStatusAndPaymentStatusAndUpdatedAtBefore(
                BookingStatus.PENDING,
                PaymentStatus.UNPAID,
                expiryTime);

        if (!expiredPending.isEmpty()) {
            log.info("Found {} PENDING bookings to cancel due to owner inaction.", expiredPending.size());
            for (BookingEntity booking : expiredPending) {
                booking.setStatus(BookingStatus.CANCELLED);
                booking.setUpdatedAt(Instant.now());
                log.info("Cancelled booking ID: {} (owner did not approve within 2 hours)", booking.getId());
            }
            bookingRepository.saveAll(expiredPending);
        }
    }
}
