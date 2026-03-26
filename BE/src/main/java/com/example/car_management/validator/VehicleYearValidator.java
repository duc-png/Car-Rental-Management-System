package com.example.car_management.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.Year;

public class VehicleYearValidator implements ConstraintValidator<ValidVehicleYear, Integer> {

    private int minYear;

    @Override
    public void initialize(ValidVehicleYear constraintAnnotation) {
        this.minYear = constraintAnnotation.min();
    }

    @Override
    public boolean isValid(Integer value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        int currentYear = Year.now().getValue();
        boolean isValid = value >= minYear && value <= currentYear;

        if (!isValid) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                    String.format("Year must be between %d and %d", minYear, currentYear)).addConstraintViolation();
        }

        return isValid;
    }
}