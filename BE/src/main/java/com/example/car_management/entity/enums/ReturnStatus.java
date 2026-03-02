package com.example.car_management.entity.enums;

public enum ReturnStatus {
    NOT_RETURNED,           // Chưa trả xe
    PENDING_INSPECTION,     // Đang chờ kiểm tra
    FEES_CALCULATED,        // Đã tính phí, chờ customer xác nhận
    CUSTOMER_CONFIRMED,     // Customer đã xác nhận
    DISPUTED,               // Customer tranh chấp
    RESOLVED                // Đã giải quyết tranh chấp
}
