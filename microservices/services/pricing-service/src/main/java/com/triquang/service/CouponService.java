package com.triquang.service;

import com.triquang.payload.request.CouponRequest;
import com.triquang.payload.request.CouponValidationRequest;
import com.triquang.payload.response.CouponResponse;
import com.triquang.payload.response.CouponValidationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CouponService {

    CouponResponse createCoupon(Long userId, CouponRequest request);

    CouponResponse getCouponById(Long userId, Long id);

    Page<CouponResponse> getCoupons(Long userId, String status, String keyword, Pageable pageable);

    List<CouponResponse> getActiveCoupons(Long userId);

    List<CouponResponse> getPublicActiveCoupons(int limit);

    CouponResponse updateCoupon(Long userId, Long id, CouponRequest request);

    void deleteCoupon(Long userId, Long id);

    CouponValidationResponse validateCoupon(CouponValidationRequest request);

    Boolean existsByCode(Long userId, String code);

    CouponResponse redeemCoupon(Long airlineId, Long userId, Long bookingId, String code);
}
