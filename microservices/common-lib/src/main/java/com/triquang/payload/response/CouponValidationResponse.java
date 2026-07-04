package com.triquang.payload.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponValidationResponse {

    private Boolean valid;
    private String code;
    private Double discountAmount;
    private Double finalAmount;
    private String message;
}
