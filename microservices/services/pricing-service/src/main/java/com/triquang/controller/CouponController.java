package com.triquang.controller;

import com.triquang.payload.request.CouponRequest;
import com.triquang.payload.request.CouponRedeemRequest;
import com.triquang.payload.request.CouponValidationRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.CouponResponse;
import com.triquang.payload.response.CouponValidationResponse;
import com.triquang.service.CouponService;
import com.triquang.utils.ResponseUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
@Tag(name = "Coupons", description = "Manage airline-owned promo codes for checkout discounts.")
public class CouponController {

    private final CouponService couponService;

    @PostMapping
    @Operation(summary = "Create a coupon", description = "Creates a promo code scoped to the authenticated airline owner.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Coupon created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Coupon code already exists for this airline")
    })
    public ResponseEntity<ApiResponse<CouponResponse>> createCoupon(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody CouponRequest request) {
        return ResponseUtil.created(couponService.createCoupon(userId, request));
    }

    @GetMapping
    @Operation(summary = "List owned coupons", description = "Returns paginated promo codes for the authenticated airline owner.")
    public ResponseEntity<ApiResponse<Page<CouponResponse>>> getCoupons(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 25, sort = "createdAt") Pageable pageable) {
        return ResponseUtil.ok(couponService.getCoupons(userId, status, keyword, pageable));
    }

    @GetMapping("/active")
    @Operation(summary = "List active owned coupons", description = "Returns currently usable promo codes for the authenticated airline.")
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getActiveCoupons(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {
        return ResponseUtil.ok(couponService.getActiveCoupons(userId));
    }

    @GetMapping("/public/active")
    @Operation(
            summary = "List public active coupons",
            description = "Returns currently active promo codes suitable for public landing and traveler discovery pages. No authentication is required."
    )
    public ResponseEntity<ApiResponse<List<CouponResponse>>> getPublicActiveCoupons(
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseUtil.ok(couponService.getPublicActiveCoupons(limit));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get an owned coupon by ID")
    public ResponseEntity<ApiResponse<CouponResponse>> getCouponById(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        return ResponseUtil.ok(couponService.getCouponById(userId, id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an owned coupon")
    public ResponseEntity<ApiResponse<CouponResponse>> updateCoupon(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id,
            @Valid @RequestBody CouponRequest request) {
        return ResponseUtil.ok(couponService.updateCoupon(userId, id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an owned coupon")
    public ResponseEntity<ApiResponse<Void>> deleteCoupon(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        couponService.deleteCoupon(userId, id);
        return ResponseUtil.noContent();
    }

    @PostMapping("/validate")
    @Operation(summary = "Validate a coupon for checkout", description = "Checks active dates, usage limit, cabin/route scope and calculates discount.")
    public ResponseEntity<ApiResponse<CouponValidationResponse>> validateCoupon(
            @Valid @RequestBody CouponValidationRequest request) {
        return ResponseUtil.ok(couponService.validateCoupon(request));
    }

    @GetMapping("/check/{code}")
    @Operation(summary = "Check whether a coupon code exists for the authenticated airline")
    public ResponseEntity<ApiResponse<Boolean>> checkCouponCode(
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
            @PathVariable String code) {
        return ResponseUtil.ok(couponService.existsByCode(userId, code));
    }

    @PostMapping("/internal/redeem")
    @Operation(summary = "Redeem a coupon after successful payment", description = "Internal booking-service operation that increments coupon usage after payment confirmation.")
    public ResponseEntity<ApiResponse<CouponResponse>> redeemCoupon(
            @Valid @RequestBody CouponRedeemRequest request) {
        return ResponseUtil.ok(couponService.redeemCoupon(
                request.getAirlineId(),
                request.getUserId(),
                request.getBookingId(),
                request.getCode()
        ));
    }
}
