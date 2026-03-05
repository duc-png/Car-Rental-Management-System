package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.request.SendMessageRequest;
import com.example.car_management.dto.response.MessageResponse;
import com.example.car_management.service.MessageService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MessageController {

    MessageService messageService;

    @PostMapping
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @Valid @RequestBody SendMessageRequest request) {
        MessageResponse result = messageService.sendMessage(request);
        return ResponseEntity.ok(ApiResponse.<MessageResponse>builder()
                .code(1000)
                .message("Message sent")
                .result(result)
                .build());
    }

    @GetMapping("/dispute/{disputeId}")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getMessagesByDispute(
            @PathVariable Integer disputeId) {
        List<MessageResponse> result = messageService.getMessagesByDispute(disputeId);
        return ResponseEntity.ok(ApiResponse.<List<MessageResponse>>builder()
                .code(1000)
                .message("Success")
                .result(result)
                .build());
    }

    @PostMapping("/dispute/{disputeId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Integer disputeId) {
        messageService.markMessagesAsRead(disputeId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(1000)
                .message("Messages marked as read")
                .build());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Integer>> getUnreadCount() {
        Integer count = messageService.getUnreadCount();
        return ResponseEntity.ok(ApiResponse.<Integer>builder()
                .code(1000)
                .message("Success")
                .result(count)
                .build());
    }
}
