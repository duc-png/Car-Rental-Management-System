package com.example.car_management.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least {min} characters", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least {min} characters", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
    INVALID_DOB(1008, "Your age must be at least {min}", HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS(1009, "Invalid credentials, please try again.", HttpStatus.BAD_REQUEST),
    PASSWORD_EXISTED(1010, "Password existed", HttpStatus.BAD_REQUEST),

    EMAIL_NOT_EXISTED(1005, "Email not existed", HttpStatus.NOT_FOUND),
    EMAIL_EXISTED(1011, "Email already exists", HttpStatus.BAD_REQUEST),
    VEHICLE_NOT_FOUND(2001, "Vehicle not found", HttpStatus.NOT_FOUND),
    VEHICLE_MODEL_NOT_FOUND(2002, "Vehicle model not found", HttpStatus.NOT_FOUND),
    LOCATION_NOT_FOUND(2003, "Location not found", HttpStatus.NOT_FOUND),
    LICENSE_PLATE_EXISTED(2004, "License plate existed", HttpStatus.BAD_REQUEST),
    IMAGE_NOT_FOUND(2005, "Vehicle image not found", HttpStatus.NOT_FOUND),
    FORBIDDEN_RESOURCE(2006, "You do not have permission", HttpStatus.FORBIDDEN),
    OWNER_REGISTRATION_NOT_FOUND(2007, "Owner registration request not found", HttpStatus.NOT_FOUND),
    OWNER_REGISTRATION_ALREADY_PENDING(2008, "Owner registration request already pending", HttpStatus.BAD_REQUEST),
    OWNER_REGISTRATION_LICENSE_PLATE_PENDING(2009, "License plate already exists in pending request",
            HttpStatus.BAD_REQUEST),
    OWNER_REGISTRATION_INVALID_STATUS(2010, "Owner registration request cannot be processed", HttpStatus.BAD_REQUEST),
    OWNER_REGISTRATION_IMAGES_REQUIRED(2011, "Owner registration images are required", HttpStatus.BAD_REQUEST),
    OWNER_REGISTRATION_IMAGES_LIMIT(2012, "Owner registration images exceed limit", HttpStatus.BAD_REQUEST),
    VEHICLE_FEATURE_NOT_FOUND(2013, "Vehicle feature not found", HttpStatus.NOT_FOUND),
    IMAGE_UPLOAD_FAILED(2014, "Invalid image file or upload failed", HttpStatus.BAD_REQUEST),
    VEHICLE_APPROVAL_REQUIRED(2015, "Vehicle is pending admin approval", HttpStatus.BAD_REQUEST),

    // ===== Booking =====
    BOOKING_NOT_FOUND(3001, "Booking not found", HttpStatus.NOT_FOUND),
    BOOKING_DATE_CONFLICT(3002, "Vehicle is already booked for this period", HttpStatus.BAD_REQUEST),
    INVALID_STATUS_TRANSITION(3003, "Invalid booking status transition", HttpStatus.BAD_REQUEST),
    PAYMENT_ERROR(3004, "Payment processing error", HttpStatus.INTERNAL_SERVER_ERROR),
    DEPOSIT_NOT_PAID(3005, "Deposit has not been paid yet", HttpStatus.BAD_REQUEST),
    FULL_PAYMENT_NOT_COMPLETED(3006, "Full payment has not been completed yet", HttpStatus.BAD_REQUEST);
    // ===== Cloudinary / Image =====
    // IMAGE_UPLOAD_FAILED(2007, "Upload image failed", HttpStatus.BAD_REQUEST);
    //
    // IMAGE_DELETE_FAILED(2008,"Delete image failed",HttpStatus.BAD_REQUEST) {
    //
    // }

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

}
