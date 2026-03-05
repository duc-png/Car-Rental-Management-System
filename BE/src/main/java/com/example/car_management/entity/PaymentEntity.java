package com.example.car_management.entity;

import com.example.car_management.entity.enums.PaymentMethod;
import com.example.car_management.entity.enums.TransactionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "payments")
public class PaymentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private BookingEntity booking;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod;

    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "transaction_id", length = 100)
    private String transactionId; // PayOS order code

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 10)
    private TransactionStatus status;

    @Column(name = "payment_date")
    private Instant paymentDate;
}
