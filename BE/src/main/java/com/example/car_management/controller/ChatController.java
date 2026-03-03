package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.request.SendChatMessageRequest;
import com.example.car_management.dto.request.StartConversationRequest;
import com.example.car_management.dto.response.ChatConversationResponse;
import com.example.car_management.dto.response.ChatMessageResponse;
import com.example.car_management.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/conversations/by-vehicle")
    public ResponseEntity<ApiResponse<ChatConversationResponse>> startConversationByVehicle(
            @Valid @RequestBody StartConversationRequest request) {
        ChatConversationResponse result = chatService.startConversationByVehicle(request);
        return ResponseEntity.ok(ApiResponse.<ChatConversationResponse>builder()
                .result(result)
                .build());
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ChatConversationResponse>>> getMyConversations() {
        List<ChatConversationResponse> result = chatService.getMyConversations();
        return ResponseEntity.ok(ApiResponse.<List<ChatConversationResponse>>builder()
                .result(result)
                .build());
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getConversationMessages(@PathVariable Integer id) {
        List<ChatMessageResponse> result = chatService.getConversationMessages(id);
        return ResponseEntity.ok(ApiResponse.<List<ChatMessageResponse>>builder()
                .result(result)
                .build());
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @PathVariable Integer id,
            @Valid @RequestBody SendChatMessageRequest request) {
        ChatMessageResponse result = chatService.sendMessage(id, request);
        return ResponseEntity.ok(ApiResponse.<ChatMessageResponse>builder()
                .result(result)
                .build());
    }
}
