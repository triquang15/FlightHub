package com.triquang.payload.request;

import com.triquang.enums.CabinClassType;
import com.triquang.enums.CouponStatus;
import com.triquang.enums.DiscountType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponRequest {

    @NotBlank(message = "Coupon code is required")
    @Size(min = 3, max = 32, message = "Coupon code must be between 3 and 32 characters")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Coupon code can contain uppercase letters, numbers, hyphens and underscores")
    private String code;

    @NotBlank(message = "Description is required")
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Discount type is required")
    private DiscountType discountType;

    @NotNull(message = "Discount value is required")
    @DecimalMin(value = "0.01", message = "Discount value must be greater than zero")
    @DecimalMax(value = "999999.99", message = "Discount value is too large")
    private Double discountValue;

    @DecimalMin(value = "0.00", message = "Minimum purchase amount cannot be negative")
    private Double minPurchaseAmount;

    @DecimalMin(value = "0.00", message = "Maximum discount amount cannot be negative")
    private Double maxDiscountAmount;

    @NotNull(message = "Valid from is required")
    private LocalDateTime validFrom;

    @NotNull(message = "Valid until is required")
    @FutureOrPresent(message = "Valid until must not be in the past")
    private LocalDateTime validUntil;

    @NotNull(message = "Usage limit is required")
    @Min(value = 1, message = "Usage limit must be at least 1")
    private Integer usageLimit;

    @NotNull(message = "Per user limit is required")
    @Min(value = 1, message = "Per user limit must be at least 1")
    private Integer perUserLimit;

    private CouponStatus status;

    private List<CabinClassType> applicableCabinClasses;

    private List<Long> applicableRoutes;
}
