package com.example.car_management.entity;

import com.example.car_management.entity.enums.DisputeStatus;
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
@Table(name = "disputes")
public class DisputeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private BookingEntity booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private UserEntity customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private UserEntity owner;

    @Column(name = "reason", length = 1000, nullable = false)
    private String reason;

    @Column(name = "disputed_amount", precision = 12, scale = 2)
    private BigDecimal disputedAmount;

    @Column(name = "customer_proposed_amount", precision = 12, scale = 2)
    private BigDecimal customerProposedAmount;

    @Column(name = "customer_counter_reason", length = 1000)
    private String customerCounterReason;

    @Column(name = "countered_at")
    private Instant counteredAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private DisputeStatus status = DisputeStatus.OPEN;

    @Column(name = "resolution_notes", length = 1000)
    private String resolutionNotes;

    @Column(name = "final_amount", precision = 12, scale = 2)
    private BigDecimal finalAmount;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
