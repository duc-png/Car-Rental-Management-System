package com.example.car_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "invalidatedtokens")
public class InvalidatedTokenEntity {

    @Id
    @Column(length = 255)
    private String id;

    @Column(name = "expiry_time", nullable = false)
    private Date expiryTime;
}
