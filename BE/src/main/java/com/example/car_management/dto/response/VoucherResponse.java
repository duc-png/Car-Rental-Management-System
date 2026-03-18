package com.example.car_management.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherResponse {
    private String code;
    private BigDecimal discountPercent;
    private Integer remainingUses;
    private Boolean valid;
}
