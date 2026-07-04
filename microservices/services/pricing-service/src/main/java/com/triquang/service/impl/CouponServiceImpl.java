package com.triquang.service.impl;

import com.triquang.client.AirlineClient;
import com.triquang.enums.CouponStatus;
import com.triquang.enums.DiscountType;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.CouponMapper;
import com.triquang.model.Coupon;
import com.triquang.model.CouponRedemption;
import com.triquang.payload.request.CouponRequest;
import com.triquang.payload.request.CouponValidationRequest;
import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.CouponResponse;
import com.triquang.payload.response.CouponValidationResponse;
import com.triquang.repository.CouponRedemptionRepository;
import com.triquang.repository.CouponRepository;
import com.triquang.service.CouponService;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final CouponRedemptionRepository couponRedemptionRepository;
    private final AirlineClient airlineClient;

    @Override
    public CouponResponse createCoupon(Long userId, CouponRequest request) {
        Long airlineId = getAirlineForUser(userId);
        validateRequestWindow(request);
        validateDiscountConfig(request);

        String code = Coupon.normalizeCode(request.getCode());
        if (couponRepository.existsByAirlineIdAndCode(airlineId, code)) {
            throw new BaseException(ErrorCode.COUPON_ALREADY_EXISTS);
        }

        Coupon saved = couponRepository.save(CouponMapper.toEntity(request, airlineId));
        return CouponMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CouponResponse getCouponById(Long userId, Long id) {
        return CouponMapper.toResponse(requireOwnedCoupon(userId, id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CouponResponse> getCoupons(Long userId, String status, String keyword, Pageable pageable) {
        Long airlineId = getAirlineForUser(userId);
        CouponStatus couponStatus = parseStatus(status);
        String normalizedKeyword = keyword == null || keyword.isBlank() ? null : keyword.trim();
        return couponRepository.searchOwnedCoupons(airlineId, couponStatus, normalizedKeyword, pageable)
                .map(CouponMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CouponResponse> getActiveCoupons(Long userId) {
        Long airlineId = getAirlineForUser(userId);
        Instant now = Instant.now();
        return couponRepository
                .findByAirlineIdAndStatusAndValidFromLessThanEqualAndValidUntilGreaterThanEqual(
                        airlineId,
                        CouponStatus.ACTIVE,
                        now,
                        now
                )
                .stream()
                .filter(this::hasRemainingUsage)
                .map(CouponMapper::toResponse)
                .toList();
    }

    @Override
    public CouponResponse updateCoupon(Long userId, Long id, CouponRequest request) {
        Long airlineId = getAirlineForUser(userId);
        Coupon coupon = couponRepository.findByIdAndAirlineId(id, airlineId)
                .orElseThrow(() -> new BaseException(ErrorCode.COUPON_NOT_FOUND));
        validateRequestWindow(request);
        validateDiscountConfig(request);

        String code = Coupon.normalizeCode(request.getCode());
        if (!coupon.getCode().equals(code)
                && couponRepository.existsByAirlineIdAndCodeAndIdNot(airlineId, code, id)) {
            throw new BaseException(ErrorCode.COUPON_ALREADY_EXISTS);
        }

        CouponMapper.updateEntity(request, coupon);
        coupon.setCode(code);
        return CouponMapper.toResponse(couponRepository.save(coupon));
    }

    @Override
    public void deleteCoupon(Long userId, Long id) {
        Coupon coupon = requireOwnedCoupon(userId, id);
        couponRepository.delete(coupon);
    }

    @Override
    @Transactional(readOnly = true)
    public CouponValidationResponse validateCoupon(CouponValidationRequest request) {
        String code = Coupon.normalizeCode(request.getCode());
        Coupon coupon = couponRepository.findByAirlineIdAndCode(request.getAirlineId(), code)
                .orElseThrow(() -> new BaseException(ErrorCode.COUPON_NOT_FOUND));

        assertUsable(coupon, request);

        double discountAmount = calculateDiscount(coupon, request.getBookingAmount());
        double finalAmount = Math.max(request.getBookingAmount() - discountAmount, 0);

        return CouponValidationResponse.builder()
                .valid(true)
                .code(coupon.getCode())
                .discountAmount(roundMoney(discountAmount))
                .finalAmount(roundMoney(finalAmount))
                .message("Coupon applied")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Boolean existsByCode(Long userId, String code) {
        Long airlineId = getAirlineForUser(userId);
        return couponRepository.existsByAirlineIdAndCode(airlineId, Coupon.normalizeCode(code));
    }

    @Override
    public CouponResponse redeemCoupon(Long airlineId, Long userId, Long bookingId, String code) {
        Coupon coupon = couponRepository.findByAirlineIdAndCodeForUpdate(airlineId, Coupon.normalizeCode(code))
                .orElseThrow(() -> new BaseException(ErrorCode.COUPON_NOT_FOUND));
        if (couponRedemptionRepository.existsByCouponIdAndBookingId(coupon.getId(), bookingId)) {
            return CouponMapper.toResponse(coupon);
        }
        if (!hasRemainingUsage(coupon)) {
            throw new BaseException(ErrorCode.COUPON_USAGE_LIMIT_REACHED);
        }
        if (hasReachedPerUserLimit(coupon, userId)) {
            throw new BaseException(ErrorCode.COUPON_USAGE_LIMIT_REACHED);
        }
        coupon.setUsedCount((coupon.getUsedCount() == null ? 0 : coupon.getUsedCount()) + 1);
        Coupon saved = couponRepository.save(coupon);
        couponRedemptionRepository.save(CouponRedemption.builder()
                .couponId(saved.getId())
                .airlineId(saved.getAirlineId())
                .userId(userId)
                .bookingId(bookingId)
                .code(saved.getCode())
                .build());
        return CouponMapper.toResponse(saved);
    }

    private Coupon requireOwnedCoupon(Long userId, Long id) {
        Long airlineId = getAirlineForUser(userId);
        return couponRepository.findByIdAndAirlineId(id, airlineId)
                .orElseThrow(() -> new BaseException(ErrorCode.COUPON_NOT_FOUND));
    }

    private Long getAirlineForUser(Long userId) {
        try {
            List<AirlineResponse> airlines = airlineClient.getAirlinesByOwner(userId);
            if (airlines == null || airlines.isEmpty()) {
                throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);
            }
            return airlines.getFirst().getId();
        } catch (FeignException.NotFound e) {
            throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);
        } catch (FeignException e) {
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    private void validateRequestWindow(CouponRequest request) {
        if (!request.getValidUntil().isAfter(request.getValidFrom())) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }

    private void validateDiscountConfig(CouponRequest request) {
        if (request.getDiscountType() == DiscountType.PERCENTAGE && request.getDiscountValue() > 100) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
        if (request.getPerUserLimit() > request.getUsageLimit()) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }

    private CouponStatus parseStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return CouponStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }

    private boolean hasRemainingUsage(Coupon coupon) {
        return coupon.getUsageLimit() == null
                || coupon.getUsedCount() == null
                || coupon.getUsedCount() < coupon.getUsageLimit();
    }

    private void assertUsable(Coupon coupon, CouponValidationRequest request) {
        if (coupon.getStatus() != CouponStatus.ACTIVE) {
            throw new BaseException(ErrorCode.COUPON_NOT_ACTIVE);
        }
        Instant now = Instant.now();
        if (now.isBefore(coupon.getValidFrom()) || now.isAfter(coupon.getValidUntil())) {
            throw new BaseException(ErrorCode.COUPON_EXPIRED);
        }
        if (!hasRemainingUsage(coupon)) {
            throw new BaseException(ErrorCode.COUPON_USAGE_LIMIT_REACHED);
        }
        if (request.getUserId() != null && hasReachedPerUserLimit(coupon, request.getUserId())) {
            throw new BaseException(ErrorCode.COUPON_USAGE_LIMIT_REACHED);
        }
        if (coupon.getMinPurchaseAmount() != null
                && request.getBookingAmount() < coupon.getMinPurchaseAmount()) {
            throw new BaseException(ErrorCode.COUPON_NOT_APPLICABLE);
        }
        if (!coupon.getApplicableCabinClasses().isEmpty()
                && (request.getCabinClass() == null
                || !coupon.getApplicableCabinClasses().contains(request.getCabinClass()))) {
            throw new BaseException(ErrorCode.COUPON_NOT_APPLICABLE);
        }
        if (!coupon.getApplicableRoutes().isEmpty()
                && (request.getRouteId() == null
                || !coupon.getApplicableRoutes().contains(request.getRouteId()))) {
            throw new BaseException(ErrorCode.COUPON_NOT_APPLICABLE);
        }
    }

    private boolean hasReachedPerUserLimit(Coupon coupon, Long userId) {
        if (userId == null || coupon.getPerUserLimit() == null) {
            return false;
        }
        return couponRedemptionRepository.countByCouponIdAndUserId(coupon.getId(), userId) >= coupon.getPerUserLimit();
    }

    private double calculateDiscount(Coupon coupon, Double bookingAmount) {
        double rawDiscount = coupon.getDiscountType() == DiscountType.PERCENTAGE
                ? bookingAmount * coupon.getDiscountValue() / 100
                : coupon.getDiscountValue();
        if (coupon.getMaxDiscountAmount() != null) {
            rawDiscount = Math.min(rawDiscount, coupon.getMaxDiscountAmount());
        }
        return Math.min(rawDiscount, bookingAmount);
    }

    private double roundMoney(double amount) {
        return Math.round(amount * 100.0) / 100.0;
    }
}
