package com.triquang.repository;

import com.triquang.model.CouponRedemption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRedemptionRepository extends JpaRepository<CouponRedemption, Long> {

    boolean existsByCouponIdAndBookingId(Long couponId, Long bookingId);

    long countByCouponIdAndUserId(Long couponId, Long userId);
}
