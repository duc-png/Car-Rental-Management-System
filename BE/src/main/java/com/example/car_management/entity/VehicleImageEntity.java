package com.example.car_management.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "vehicle_images")
public class VehicleImageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private VehicleEntity vehicle;

    @Lob
    @Column(name = "image_url", nullable = false)
    private String imageUrl;

    @Column(name = "is_main")
    private Boolean isMain;
}
