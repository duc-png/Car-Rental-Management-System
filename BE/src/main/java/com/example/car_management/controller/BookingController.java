package com.example.car_management.controller;

import com.example.car_management.dto.request.CreateBookingRequest;
import com.example.car_management.dto.request.UpdateBookingStatusRequest;
import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.response.BookingResponse;
import com.example.car_management.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody CreateBookingRequest request) {

        BookingResponse response = bookingService.createBooking(request);

        return ResponseEntity.ok(ApiResponse.<BookingResponse>builder()
                .result(response)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(@PathVariable Integer id) {

        BookingResponse response = bookingService.getBookingById(id);

        return ResponseEntity.ok(ApiResponse.<BookingResponse>builder()
                .result(response)
                .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getUserBookings() {
        List<BookingResponse> bookings = bookingService.getUserBookings();
        return ResponseEntity.ok(ApiResponse.<List<BookingResponse>>builder()
                .result(bookings)
                .build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<BookingResponse>> updateBookingStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateBookingStatusRequest request) {
        BookingResponse response = bookingService.updateBookingStatus(id, request);
        return ResponseEntity.ok(ApiResponse.<BookingResponse>builder()
                .result(response)
                .build());
    }
}
