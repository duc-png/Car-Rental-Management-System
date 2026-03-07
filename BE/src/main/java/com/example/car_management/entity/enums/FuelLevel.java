package com.example.car_management.entity.enums;

public enum FuelLevel {
    EMPTY(0),
    QUARTER(25),
    HALF(50),
    THREE_QUARTERS(75),
    FULL(100);

    private final int percentage;

    FuelLevel(int percentage) {
        this.percentage = percentage;
    }

    public int getPercentage() {
        return percentage;
    }

    public static int getDifference(FuelLevel start, FuelLevel end) {
        return start.percentage - end.percentage;
    }
}
