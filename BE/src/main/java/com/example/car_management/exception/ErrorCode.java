package com.example.car_management.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    USER_NOT_EXISTED(4004,"User Not Existed",HttpStatus.NOT_FOUND),
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least {min} characters", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least {min} characters", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
    INVALID_DOB(1008, "Your age must be at least {min}", HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS(1009, "Invalid credentials, please try again.", HttpStatus.BAD_REQUEST),
    PASSWORD_EXISTED(1010, "Password existed", HttpStatus.BAD_REQUEST),
    OLD_PASSWORD_INCORRECT(1012, "Current password is incorrect", HttpStatus.BAD_REQUEST),
    PASSWORD_CONFIRM_MISMATCH(1013, "Confirm password does not match", HttpStatus.BAD_REQUEST),
    EMAIL_OTP_NOT_FOUND(1014, "Email OTP does not exist or has expired", HttpStatus.BAD_REQUEST),
    EMAIL_OTP_INVALID(1015, "Invalid email OTP", HttpStatus.BAD_REQUEST),
    EMAIL_OTP_EXPIRED(1016, "Email OTP expired", HttpStatus.BAD_REQUEST),
    EMAIL_OTP_SEND_FAILED(1017, "Cannot send OTP email", HttpStatus.BAD_REQUEST),
    LICENSE_OCR_NOT_CONFIGURED(1018, "License OCR service is not configured", HttpStatus.BAD_REQUEST),
    LICENSE_OCR_FAILED(1019, "Cannot scan driving license from image", HttpStatus.BAD_REQUEST),
    LICENSE_VERIFICATION_INVALID_STATUS(1020, "License verification status is invalid", HttpStatus.BAD_REQUEST),
    LICENSE_VERIFICATION_NOT_PENDING(1021, "License verification request is not pending", HttpStatus.BAD_REQUEST),
    LICENSE_VERIFICATION_NOTE_REQUIRED(1022, "Rejection reason is required", HttpStatus.BAD_REQUEST),
    LICENSE_NUMBER_EXISTED(1023, "Driving license number already belongs to another account", HttpStatus.BAD_REQUEST),
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
    OWNER_REGISTRATION_LICENSE_PLATE_PENDING(2009, "License plate already exists in pending request",HttpStatus.BAD_REQUEST),
    OWNER_REGISTRATION_INVALID_STATUS(2010, "Owner registration request cannot be processed", HttpStatus.BAD_REQUEST),
    OWNER_REGISTRATION_IMAGES_REQUIRED(2011, "Owner registration images are required", HttpStatus.BAD_REQUEST),
    OWNER_REGISTRATION_IMAGES_LIMIT(2012, "Owner registration images exceed limit", HttpStatus.BAD_REQUEST),
    VEHICLE_FEATURE_NOT_FOUND(2013, "Vehicle feature not found", HttpStatus.NOT_FOUND),
    IMAGE_UPLOAD_FAILED(2014, "Invalid image file or upload failed", HttpStatus.BAD_REQUEST),
    VEHICLE_APPROVAL_REQUIRED(2015, "Vehicle is pending admin approval", HttpStatus.BAD_REQUEST),
    VEHICLE_IMMUTABLE_FIELDS(2016, "Core vehicle information cannot be changed after creation", HttpStatus.BAD_REQUEST),
    OWNER_REGISTRATION_EMAIL_NOT_VERIFIED(2017, "Email is not verified. OTP has been sent", HttpStatus.BAD_REQUEST),
    MAINTENANCE_NOT_FOUND(3001, "Maintenance record not found", HttpStatus.NOT_FOUND),
    MAINTENANCE_ALREADY_EXISTS(3002, "Vehicle already has active maintenance", HttpStatus.BAD_REQUEST),
    MAINTENANCE_INVALID_STATUS_TRANSITION(3003, "Invalid maintenance status transition", HttpStatus.BAD_REQUEST),
    MAINTENANCE_CANNOT_MODIFY_COMPLETED(3004, "Cannot modify completed or cancelled maintenance",
            HttpStatus.BAD_REQUEST),
    VEHICLE_NOT_AVAILABLE_FOR_MAINTENANCE(3005, "Vehicle is not available for maintenance", HttpStatus.BAD_REQUEST),
    VEHICLE_OWNERSHIP_REQUIRED(3006, "You do not own this vehicle", HttpStatus.FORBIDDEN),

    // ===== Booking =====
    BOOKING_NOT_FOUND(3007, "Booking not found", HttpStatus.NOT_FOUND),
    BOOKING_NOT_ONGOING(3008, "Booking is not in ONGOING status", HttpStatus.BAD_REQUEST),
    BOOKING_ALREADY_INSPECTED(3009, "Booking already has return inspection", HttpStatus.BAD_REQUEST),
    BOOKING_NOT_INSPECTED(3010, "Booking has not been inspected yet", HttpStatus.BAD_REQUEST),
    INVALID_ODOMETER_READING(3011, "Odometer end must be greater than or equal to start", HttpStatus.BAD_REQUEST),
    BOOKING_DATE_CONFLICT(3012, "Vehicle is already booked for this period", HttpStatus.BAD_REQUEST),
    INVALID_STATUS_TRANSITION(3013, "Invalid booking status transition", HttpStatus.BAD_REQUEST),
    PAYMENT_ERROR(3014, "Payment processing error", HttpStatus.INTERNAL_SERVER_ERROR),
    DEPOSIT_NOT_PAID(3015, "Deposit has not been paid yet", HttpStatus.BAD_REQUEST),
    FULL_PAYMENT_NOT_COMPLETED(3016, "Full payment has not been completed yet", HttpStatus.BAD_REQUEST),

    // chat
    CHAT_CONVERSATION_NOT_FOUND(4001, "Chat conversation not found", HttpStatus.NOT_FOUND),
    CANNOT_CHAT_OWN_VEHICLE(4002, "You cannot start chat with your own vehicle", HttpStatus.BAD_REQUEST),

    // Dispute
    DISPUTE_NOT_FOUND(5001, "Dispute not found", HttpStatus.NOT_FOUND),
    DISPUTE_ALREADY_EXISTS(5002, "Active dispute already exists for this booking", HttpStatus.BAD_REQUEST),
    DISPUTE_ALREADY_RESOLVED(5003, "Dispute is already resolved", HttpStatus.BAD_REQUEST),
    CANNOT_CREATE_DISPUTE(5004, "Cannot create dispute at this stage", HttpStatus.BAD_REQUEST),

    // Message
    MESSAGE_NOT_FOUND(6001, "Message not found", HttpStatus.NOT_FOUND),
    CANNOT_SEND_MESSAGE(6002, "Cannot send message to this dispute", HttpStatus.BAD_REQUEST),

    // ===== Voucher =====
    VOUCHER_NOT_FOUND(7001, "Voucher not found", HttpStatus.NOT_FOUND),
    VOUCHER_ALREADY_USED(7002, "Voucher has been fully used", HttpStatus.BAD_REQUEST),
    VOUCHER_INVALID(7003, "Voucher is invalid or inactive", HttpStatus.BAD_REQUEST),
    VOUCHER_CODE_EXISTED(7004, "Voucher code already exists", HttpStatus.BAD_REQUEST),
    VOUCHER_DISCOUNT_EXCEEDED(7005, "Discount percent must not exceed 30%", HttpStatus.BAD_REQUEST);

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

}
