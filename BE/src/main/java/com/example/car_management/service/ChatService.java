package com.example.car_management.service;

import com.example.car_management.dto.request.SendChatMessageRequest;
import com.example.car_management.dto.request.StartConversationRequest;
import com.example.car_management.dto.response.ChatConversationResponse;
import com.example.car_management.dto.response.ChatMessageResponse;
import com.example.car_management.entity.ChatConversationEntity;
import com.example.car_management.entity.ChatMessageEntity;
import com.example.car_management.entity.UserEntity;
import com.example.car_management.entity.VehicleEntity;
import com.example.car_management.exception.AppException;
import com.example.car_management.exception.ErrorCode;
import com.example.car_management.repository.ChatConversationRepository;
import com.example.car_management.repository.ChatMessageRepository;
import com.example.car_management.repository.UserRepository;
import com.example.car_management.repository.VehicleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatService {

    ChatConversationRepository chatConversationRepository;
    ChatMessageRepository chatMessageRepository;
    UserRepository userRepository;
    VehicleRepository vehicleRepository;

    @Transactional
    public ChatConversationResponse startConversationByVehicle(StartConversationRequest request) {
        UserEntity currentUser = getCurrentUser();
        VehicleEntity vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

        Integer customerId = currentUser.getId();
        Integer ownerId = vehicle.getOwner() != null ? vehicle.getOwner().getId() : null;
        if (ownerId == null) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        if (customerId.equals(ownerId)) {
            throw new AppException(ErrorCode.CANNOT_CHAT_OWN_VEHICLE);
        }

        ChatConversationEntity conversation = chatConversationRepository
                .findFirstByCustomerIdAndOwnerIdAndVehicleIdOrderByLastMessageAtDesc(customerId, ownerId, vehicle.getId())
                .orElseGet(() -> chatConversationRepository.save(
                        ChatConversationEntity.builder()
                                .customer(currentUser)
                                .owner(vehicle.getOwner())
                                .vehicle(vehicle)
                                .createdAt(Instant.now())
                                .lastMessageAt(Instant.now())
                                .build()));

        return toConversationResponse(conversation, currentUser.getId());
    }

    @Transactional(readOnly = true)
    public List<ChatConversationResponse> getMyConversations() {
        UserEntity currentUser = getCurrentUser();
        List<ChatConversationEntity> conversations = chatConversationRepository
                .findByCustomerIdOrOwnerIdOrderByLastMessageAtDesc(currentUser.getId(), currentUser.getId());

        return conversations.stream()
                .map(conversation -> toConversationResponse(conversation, currentUser.getId()))
                .toList();
    }

    @Transactional
    public List<ChatMessageResponse> getConversationMessages(Integer conversationId) {
        UserEntity currentUser = getCurrentUser();
        ChatConversationEntity conversation = getParticipantConversation(conversationId, currentUser.getId());

        chatMessageRepository.markOtherSideMessagesAsRead(conversation.getId(), currentUser.getId());

        return chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Transactional
    public ChatMessageResponse sendMessage(Integer conversationId, SendChatMessageRequest request) {
        UserEntity currentUser = getCurrentUser();
        ChatConversationEntity conversation = getParticipantConversation(conversationId, currentUser.getId());

        ChatMessageEntity saved = chatMessageRepository.save(ChatMessageEntity.builder()
                .conversation(conversation)
                .sender(currentUser)
                .content(request.getContent().trim())
                .isRead(false)
                .createdAt(Instant.now())
                .build());

        conversation.setLastMessageAt(saved.getCreatedAt());
        chatConversationRepository.save(conversation);

        return toMessageResponse(saved);
    }

    private ChatConversationEntity getParticipantConversation(Integer conversationId, Integer userId) {
        ChatConversationEntity conversation = chatConversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CHAT_CONVERSATION_NOT_FOUND));

        Integer customerId = conversation.getCustomer() != null ? conversation.getCustomer().getId() : null;
        Integer ownerId = conversation.getOwner() != null ? conversation.getOwner().getId() : null;
        if (!userId.equals(customerId) && !userId.equals(ownerId)) {
            throw new AppException(ErrorCode.FORBIDDEN_RESOURCE);
        }

        return conversation;
    }

    private UserEntity getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private ChatConversationResponse toConversationResponse(ChatConversationEntity conversation, Integer viewerId) {
        ChatMessageEntity lastMessage = chatMessageRepository
                .findTopByConversationIdOrderByCreatedAtDesc(conversation.getId())
                .orElse(null);

        UserEntity otherUser = viewerId.equals(conversation.getCustomer().getId())
                ? conversation.getOwner()
                : conversation.getCustomer();

        String vehicleName = null;
        if (conversation.getVehicle() != null && conversation.getVehicle().getModel() != null) {
            String brandName = conversation.getVehicle().getModel().getBrand() != null
                    ? conversation.getVehicle().getModel().getBrand().getName()
                    : null;
            String modelName = conversation.getVehicle().getModel().getName();
            vehicleName = (brandName == null || brandName.isBlank())
                    ? modelName
                    : (brandName + " " + modelName);
        }

        return ChatConversationResponse.builder()
                .id(conversation.getId())
                .customerId(conversation.getCustomer() != null ? conversation.getCustomer().getId() : null)
                .ownerId(conversation.getOwner() != null ? conversation.getOwner().getId() : null)
                .vehicleId(conversation.getVehicle() != null ? conversation.getVehicle().getId() : null)
                .bookingId(conversation.getBooking() != null ? conversation.getBooking().getId() : null)
                .otherUserId(otherUser != null ? otherUser.getId() : null)
                .otherUserName(otherUser != null ? otherUser.getFullName() : null)
                .vehicleName(vehicleName)
                .lastMessage(lastMessage != null ? lastMessage.getContent() : null)
                .lastMessageSenderId(lastMessage != null && lastMessage.getSender() != null ? lastMessage.getSender().getId() : null)
                .lastMessageAt(conversation.getLastMessageAt())
                .unreadCount(chatMessageRepository.countByConversationIdAndSenderIdNotAndIsReadFalse(conversation.getId(), viewerId))
                .createdAt(conversation.getCreatedAt())
                .build();
    }

    private ChatMessageResponse toMessageResponse(ChatMessageEntity message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation() != null ? message.getConversation().getId() : null)
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderName(message.getSender() != null ? message.getSender().getFullName() : null)
                .content(message.getContent())
                .isRead(message.getIsRead())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
