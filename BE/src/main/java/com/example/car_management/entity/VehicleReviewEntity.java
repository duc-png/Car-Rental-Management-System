package com.example.car_management.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Check;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "reviews",
    uniqueConstraints = @UniqueConstraint(name = "booking_id", columnNames = "booking_id"))
@Check(constraints = "vehicle_rating between 1 and 5")
public class VehicleReviewEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private BookingEntity booking;

    @Column(name = "vehicle_rating")
    private Integer vehicleRating;

    @Column(columnDefinition = "text")
    private String comment;

    @Column(name = "created_at")
    private Instant createdAt;
}
