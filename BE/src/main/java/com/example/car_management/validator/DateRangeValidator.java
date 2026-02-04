package com.example.car_management.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.lang.reflect.Field;
import java.time.LocalDateTime;

public class DateRangeValidator implements ConstraintValidator<ValidDateRange, Object> {

    private String startDateFieldName;
    private String endDateFieldName;

    @Override
    public void initialize(ValidDateRange constraintAnnotation) {
        this.startDateFieldName = constraintAnnotation.startDate();
        this.endDateFieldName = constraintAnnotation.endDate();
    }

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        try {
            Field startDateField = value.getClass().getDeclaredField(startDateFieldName);
            Field endDateField = value.getClass().getDeclaredField(endDateFieldName);

            startDateField.setAccessible(true);
            endDateField.setAccessible(true);

            LocalDateTime startDate = (LocalDateTime) startDateField.get(value);
            LocalDateTime endDate = (LocalDateTime) endDateField.get(value);

            if (startDate == null || endDate == null) {
                return true; // Let @NotNull handle null values
            }

            return endDate.isAfter(startDate);

        } catch (Exception e) {
            return false;
        }
    }
}
