package com.example.car_management.validator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = VehicleYearValidator.class)
@Documented
public @interface ValidVehicleYear {
    String message() default "Year must be between 1900 and current year";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    int min() default 1900;
}