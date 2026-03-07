package com.example.car_management.service;

import com.example.car_management.dto.request.SendMessageRequest;
import com.example.car_management.dto.response.MessageResponse;
import com.example.car_management.entity.DisputeEntity;
import com.example.car_management.entity.MessageEntity;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.enums.DisputeStatus;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.repository.DisputeRepository;
import com.example.car_management.repository.MessageRepository;
import com.example.car_management.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MessageService {

    MessageRepository messageRepository;
    DisputeRepository disputeRepository;
    UserRepository userRepository;

    @Transactional
    public MessageResponse sendMessage(SendMessageRequest request) {
        Integer senderId = getCurrentUserId();
        
        DisputeEntity dispute = disputeRepository.findById(request.getDisputeId())
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));

        Integer customerId = dispute.getCustomer().getId();
        Integer ownerId = dispute.getOwner().getId();

        if (!senderId.equals(customerId) && !senderId.equals(ownerId)) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        if (dispute.getStatus() == DisputeStatus.RESOLVED || dispute.getStatus() == DisputeStatus.ESCALATED) {
            throw new AppException(ErrorCode.CANNOT_SEND_MESSAGE);
        }

        if (dispute.getStatus() == DisputeStatus.OPEN) {
            dispute.setStatus(DisputeStatus.IN_DISCUSSION);
            dispute.setUpdatedAt(Instant.now());
            disputeRepository.save(dispute);
        }

        UserEntity sender = userRepository.findById(senderId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        
        Integer receiverId = senderId.equals(customerId) ? ownerId : customerId;
        UserEntity receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        MessageEntity message = MessageEntity.builder()
                .sender(sender)
                .receiver(receiver)
                .dispute(dispute)
                .booking(dispute.getBooking())
                .content(request.getContent())
                .sentAt(Instant.now())
                .isRead(false)
                .build();

        messageRepository.save(message);

        return toResponse(message, ownerId);
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessagesByDispute(Integer disputeId) {
        Integer userId = getCurrentUserId();
        
        DisputeEntity dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));

        if (!userId.equals(dispute.getCustomer().getId()) && !userId.equals(dispute.getOwner().getId())) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        Integer ownerId = dispute.getOwner().getId();
        List<MessageEntity> messages = messageRepository.findByDisputeId(disputeId);
        
        return messages.stream()
                .map(m -> toResponse(m, ownerId))
                .collect(Collectors.toList());
    }

    @Transactional
    public void markMessagesAsRead(Integer disputeId) {
        Integer userId = getCurrentUserId();
        
        DisputeEntity dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new AppException(ErrorCode.DISPUTE_NOT_FOUND));

        if (!userId.equals(dispute.getCustomer().getId()) && !userId.equals(dispute.getOwner().getId())) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        messageRepository.markAsReadByDisputeAndUser(disputeId, userId);
    }

    @Transactional(readOnly = true)
    public Integer getUnreadCount() {
        Integer userId = getCurrentUserId();
        return messageRepository.countUnreadByUserId(userId);
    }

    private MessageResponse toResponse(MessageEntity message, Integer ownerId) {
        return MessageResponse.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullName())
                .isSenderOwner(message.getSender().getId().equals(ownerId))
                .receiverId(message.getReceiver().getId())
                .receiverName(message.getReceiver().getFullName())
                .bookingId(message.getBooking() != null ? message.getBooking().getId() : null)
                .disputeId(message.getDispute() != null ? message.getDispute().getId() : null)
                .content(message.getContent())
                .sentAt(message.getSentAt())
                .isRead(message.getIsRead())
                .readAt(message.getReadAt())
                .build();
    }

    private Integer getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        UserEntity user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return user.getId();
    }
}
