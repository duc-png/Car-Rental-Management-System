package com.example.car_management.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateVoucherRequest {
    @NotBlank(message = "Voucher code is required")
    @Size(min = 8, max = 8, message = "Voucher code must be 8 characters")
    String code;

    @NotNull(message = "Discount percent is required")
    @DecimalMin(value = "0.01", message = "Discount must be greater than 0")
    @DecimalMax(value = "30.00", message = "Discount must not exceed 30%")
    BigDecimal discountPercent;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    Integer quantity;
}
