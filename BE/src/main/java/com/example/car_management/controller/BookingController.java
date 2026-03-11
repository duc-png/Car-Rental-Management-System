package com.example.car_management.controller;

import com.example.car_management.dto.request.CreateBookingRequest;
import com.example.car_management.dto.request.UpdateBookingStatusRequest;
import com.example.car_management.dto.ApiResponse;
import com.example.car_management.dto.response.BookingJourneyResponse;
import com.example.car_management.dto.response.BookingResponse;
import com.example.car_management.dto.response.BookedDateResponse;
import com.example.car_management.dto.response.OwnerBookingCalendarItemResponse;
import com.example.car_management.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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

        @GetMapping("/{id}/journey")
        public ResponseEntity<ApiResponse<BookingJourneyResponse>> getBookingJourney(@PathVariable Integer id) {
                BookingJourneyResponse response = bookingService.getBookingJourney(id);
                return ResponseEntity.ok(ApiResponse.<BookingJourneyResponse>builder()
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

        @GetMapping("/vehicle/{vehicleId}/booked-dates")
        public ResponseEntity<ApiResponse<List<BookedDateResponse>>> getBookedDatesByVehicle(
                        @PathVariable Integer vehicleId) {
                List<BookedDateResponse> bookedDates = bookingService.getBookedDatesByVehicle(vehicleId);
                return ResponseEntity.ok(ApiResponse.<List<BookedDateResponse>>builder()
                                .result(bookedDates)
                                .build());
        }

        @GetMapping("/owner/calendar")
        public ResponseEntity<ApiResponse<List<OwnerBookingCalendarItemResponse>>> getOwnerSuccessfulBookingCalendar(
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
                        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
                        @RequestParam(required = false) Integer vehicleId) {
                List<OwnerBookingCalendarItemResponse> result = bookingService.getOwnerSuccessfulBookingCalendar(
                                from,
                                to,
                                vehicleId);

                return ResponseEntity.ok(ApiResponse.<List<OwnerBookingCalendarItemResponse>>builder()
                                .result(result)
                                .build());
        }

        @PostMapping("/{id}/confirm-handover")
        public ResponseEntity<ApiResponse<BookingResponse>> confirmHandover(@PathVariable Integer id) {
                BookingResponse response = bookingService.confirmHandover(id);
                return ResponseEntity.ok(ApiResponse.<BookingResponse>builder()
                                .result(response)
                                .build());
        }
}
