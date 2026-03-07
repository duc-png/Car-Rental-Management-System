package com.example.car_management.repository;

import com.example.car_management.entity.ChatMessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessageEntity, Integer> {
        List<ChatMessageEntity> findByConversationIdOrderByCreatedAtAsc(Integer conversationId);

        List<ChatMessageEntity> findByConversation_Owner_IdOrderByConversation_IdAscCreatedAtAsc(Integer ownerId);

        Optional<ChatMessageEntity> findTopByConversationIdOrderByCreatedAtDesc(Integer conversationId);

        long countByConversationIdAndSenderIdNotAndIsReadFalse(Integer conversationId, Integer senderId);

        @Modifying
        @Query("""
                        update ChatMessageEntity m
                        set m.isRead = true
                        where m.conversation.id = :conversationId
                          and m.sender.id <> :viewerId
                          and m.isRead = false
                        """)
        int markOtherSideMessagesAsRead(
                        @Param("conversationId") Integer conversationId,
                        @Param("viewerId") Integer viewerId);
}
