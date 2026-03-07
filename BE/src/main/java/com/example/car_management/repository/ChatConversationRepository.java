package com.example.car_management.repository;

import com.example.car_management.entity.ChatConversationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatConversationRepository extends JpaRepository<ChatConversationEntity, Integer> {
    List<ChatConversationEntity> findByCustomerIdOrOwnerIdOrderByLastMessageAtDesc(Integer customerId, Integer ownerId);

    List<ChatConversationEntity> findByOwnerId(Integer ownerId);

    Optional<ChatConversationEntity> findFirstByCustomerIdAndOwnerIdAndVehicleIdOrderByLastMessageAtDesc(
            Integer customerId,
            Integer ownerId,
            Integer vehicleId);
}
