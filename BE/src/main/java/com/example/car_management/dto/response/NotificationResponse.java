package com.example.car_management.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Integer id;
    private Integer userId;
    private String title;
    private String message;
    private String type;
    private String priority;
    private Boolean isRead;
    private String deepLink;
    private Instant createdAt;
}
