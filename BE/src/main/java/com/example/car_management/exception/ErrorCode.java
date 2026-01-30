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
<<<<<<< HEAD
=======
    EMAIL_NOT_EXISTED(1005, "Email not existed", HttpStatus.NOT_FOUND),
    EMAIL_EXISTED(1011, "Email already exists", HttpStatus.BAD_REQUEST),
>>>>>>> ducmito
    VEHICLE_NOT_FOUND(2001, "Vehicle not found", HttpStatus.NOT_FOUND),
    VEHICLE_MODEL_NOT_FOUND(2002, "Vehicle model not found", HttpStatus.NOT_FOUND),
    LOCATION_NOT_FOUND(2003, "Location not found", HttpStatus.NOT_FOUND),
    LICENSE_PLATE_EXISTED(2004, "License plate existed", HttpStatus.BAD_REQUEST),
    IMAGE_NOT_FOUND(2005, "Vehicle image not found", HttpStatus.NOT_FOUND),
    FORBIDDEN_RESOURCE(2006, "You do not have permission", HttpStatus.FORBIDDEN);

<<<<<<< HEAD

=======
>>>>>>> ducmito
    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;

}
