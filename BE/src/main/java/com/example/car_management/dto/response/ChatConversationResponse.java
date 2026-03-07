package com.example.car_management.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatConversationResponse {
    private Integer id;

    private Integer customerId;
    private Integer ownerId;
    private Integer vehicleId;
    private Integer bookingId;

    private Integer otherUserId;
    private String otherUserName;

    private String vehicleName;

    private String lastMessage;
    private Integer lastMessageSenderId;
    private Instant lastMessageAt;

    private Long unreadCount;
    private Instant createdAt;
}
