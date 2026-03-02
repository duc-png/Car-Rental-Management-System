package com.example.car_management.controller;

import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.response.NotificationResponse;
import com.example.car_management.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> myNotifications(
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(required = false) Integer limit) {
        List<NotificationResponse> data = notificationService.getMyNotifications(unreadOnly, limit);
        return ResponseEntity.ok(ApiResponse.<List<NotificationResponse>>builder()
                .code(1000)
                .message("Success")
                .result(data)
                .build());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> unreadCount() {
        long count = notificationService.getMyUnreadCount();
        return ResponseEntity.ok(ApiResponse.<Map<String, Long>>builder()
                .code(1000)
                .message("Success")
                .result(Map.of("count", count))
                .build());
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Object>> markRead(@PathVariable Integer id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .code(1000)
                .message("Success")
                .build());
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Object>> markAllRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.builder()
                .code(1000)
                .message("Success")
                .build());
    }
}
