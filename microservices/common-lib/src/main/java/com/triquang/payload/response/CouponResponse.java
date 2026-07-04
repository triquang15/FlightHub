package com.triquang.payload.response;

import com.triquang.enums.CabinClassType;
import com.triquang.enums.CouponStatus;
import com.triquang.enums.DiscountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CouponResponse {

    private Long id;
    private Long airlineId;
    private String code;
    private String description;
    private DiscountType discountType;
    private Double discountValue;
    private Double minPurchaseAmount;
    private Double maxDiscountAmount;
    private Instant validFrom;
    private Instant validUntil;
    private Integer usageLimit;
    private Integer perUserLimit;
    private Integer usedCount;
    private Integer remainingUsage;
    private CouponStatus status;
    private List<CabinClassType> applicableCabinClasses;
    private List<Long> applicableRoutes;
    private Instant createdAt;
    private Instant updatedAt;
}
