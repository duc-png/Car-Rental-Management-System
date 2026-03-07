package com.example.car_management.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageResponse {

    private Integer id;
    
    private Integer senderId;
    private String senderName;
    private Boolean isSenderOwner;
    
    private Integer receiverId;
    private String receiverName;
    
    private Integer bookingId;
    private Integer disputeId;
    
    private String content;
    private Instant sentAt;
    private Boolean isRead;
    private Instant readAt;
}
