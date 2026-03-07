package com.example.car_management.repository;

import com.example.car_management.entity.MessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<MessageEntity, Integer> {

    @Query("SELECT m FROM MessageEntity m WHERE m.dispute.id = :disputeId ORDER BY m.sentAt ASC")
    List<MessageEntity> findByDisputeId(@Param("disputeId") Integer disputeId);

    @Query("SELECT m FROM MessageEntity m WHERE m.booking.id = :bookingId ORDER BY m.sentAt ASC")
    List<MessageEntity> findByBookingId(@Param("bookingId") Integer bookingId);

    @Query("SELECT m FROM MessageEntity m WHERE " +
           "(m.sender.id = :userId OR m.receiver.id = :userId) " +
           "ORDER BY m.sentAt DESC")
    List<MessageEntity> findByUserId(@Param("userId") Integer userId);

    @Query("SELECT COUNT(m) FROM MessageEntity m WHERE m.receiver.id = :userId AND m.isRead = false")
    Integer countUnreadByUserId(@Param("userId") Integer userId);

    @Modifying
    @Query("UPDATE MessageEntity m SET m.isRead = true, m.readAt = CURRENT_TIMESTAMP WHERE m.dispute.id = :disputeId AND m.receiver.id = :userId AND m.isRead = false")
    void markAsReadByDisputeAndUser(@Param("disputeId") Integer disputeId, @Param("userId") Integer userId);
}
