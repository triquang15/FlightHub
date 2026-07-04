package com.triquang.mapper;

import com.triquang.enums.CouponStatus;
import com.triquang.model.Coupon;
import com.triquang.payload.request.CouponRequest;
import com.triquang.payload.response.CouponResponse;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashSet;

public final class CouponMapper {

    private CouponMapper() {
    }

    public static Coupon toEntity(CouponRequest request, Long airlineId) {
        Coupon coupon = Coupon.builder()
                .airlineId(airlineId)
                .code(Coupon.normalizeCode(request.getCode()))
                .description(request.getDescription().trim())
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minPurchaseAmount(request.getMinPurchaseAmount())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .validFrom(toInstant(request.getValidFrom()))
                .validUntil(toInstant(request.getValidUntil()))
                .usageLimit(request.getUsageLimit())
                .perUserLimit(request.getPerUserLimit())
                .status(request.getStatus() == null ? CouponStatus.ACTIVE : request.getStatus())
                .applicableCabinClasses(request.getApplicableCabinClasses() == null
                        ? new LinkedHashSet<>()
                        : new LinkedHashSet<>(request.getApplicableCabinClasses()))
                .applicableRoutes(request.getApplicableRoutes() == null
                        ? new LinkedHashSet<>()
                        : new LinkedHashSet<>(request.getApplicableRoutes()))
                .build();
        return coupon;
    }

    public static void updateEntity(CouponRequest request, Coupon coupon) {
        coupon.setDescription(request.getDescription().trim());
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(request.getDiscountValue());
        coupon.setMinPurchaseAmount(request.getMinPurchaseAmount());
        coupon.setMaxDiscountAmount(request.getMaxDiscountAmount());
        coupon.setValidFrom(toInstant(request.getValidFrom()));
        coupon.setValidUntil(toInstant(request.getValidUntil()));
        coupon.setUsageLimit(request.getUsageLimit());
        coupon.setPerUserLimit(request.getPerUserLimit());
        coupon.setStatus(request.getStatus() == null ? CouponStatus.ACTIVE : request.getStatus());
        coupon.setApplicableCabinClasses(request.getApplicableCabinClasses() == null
                ? new LinkedHashSet<>()
                : new LinkedHashSet<>(request.getApplicableCabinClasses()));
        coupon.setApplicableRoutes(request.getApplicableRoutes() == null
                ? new LinkedHashSet<>()
                : new LinkedHashSet<>(request.getApplicableRoutes()));
    }

    public static CouponResponse toResponse(Coupon coupon) {
        return CouponResponse.builder()
                .id(coupon.getId())
                .airlineId(coupon.getAirlineId())
                .code(coupon.getCode())
                .description(coupon.getDescription())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .minPurchaseAmount(coupon.getMinPurchaseAmount())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .validFrom(coupon.getValidFrom())
                .validUntil(coupon.getValidUntil())
                .usageLimit(coupon.getUsageLimit())
                .perUserLimit(coupon.getPerUserLimit())
                .usedCount(coupon.getUsedCount())
                .remainingUsage(coupon.getRemainingUsage())
                .status(coupon.getStatus())
                .applicableCabinClasses(new ArrayList<>(coupon.getApplicableCabinClasses()))
                .applicableRoutes(new ArrayList<>(coupon.getApplicableRoutes()))
                .createdAt(coupon.getCreatedAt())
                .updatedAt(coupon.getUpdatedAt())
                .build();
    }

    private static java.time.Instant toInstant(LocalDateTime value) {
        return value == null ? null : value.toInstant(ZoneOffset.UTC);
    }
}
