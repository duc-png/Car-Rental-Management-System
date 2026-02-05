package com.example.car_management.repository;

import java.math.BigDecimal;

public interface CustomerBookingSummary {
    Integer getCustomerId();
    Long getTotalBookings();
    BigDecimal getTotalRevenue();
}
