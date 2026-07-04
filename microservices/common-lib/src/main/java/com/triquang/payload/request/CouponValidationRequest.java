package com.triquang.payload.request;

import com.triquang.enums.CabinClassType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponValidationRequest {

    @NotBlank(message = "Coupon code is required")
    private String code;

    @NotNull(message = "Airline ID is required")
    private Long airlineId;

    private Long userId;

    private Long routeId;

    private CabinClassType cabinClass;

    @NotNull(message = "Booking amount is required")
    @DecimalMin(value = "0.00", message = "Booking amount cannot be negative")
    private Double bookingAmount;
}
