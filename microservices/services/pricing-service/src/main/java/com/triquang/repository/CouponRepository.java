package com.triquang.repository;

import com.triquang.enums.CouponStatus;
import com.triquang.model.Coupon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    boolean existsByAirlineIdAndCode(Long airlineId, String code);

    boolean existsByAirlineIdAndCodeAndIdNot(Long airlineId, String code, Long id);

    Optional<Coupon> findByIdAndAirlineId(Long id, Long airlineId);

    Optional<Coupon> findByAirlineIdAndCode(Long airlineId, String code);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Coupon c WHERE c.airlineId = :airlineId AND c.code = :code")
    Optional<Coupon> findByAirlineIdAndCodeForUpdate(@Param("airlineId") Long airlineId, @Param("code") String code);

    List<Coupon> findByAirlineIdAndStatusAndValidFromLessThanEqualAndValidUntilGreaterThanEqual(
            Long airlineId,
            CouponStatus status,
            Instant validFrom,
            Instant validUntil
    );

    @Query("""
        SELECT c FROM Coupon c
        WHERE c.status = :status
          AND c.validFrom <= :now
          AND c.validUntil >= :now
          AND (c.usageLimit IS NULL OR c.usedCount < c.usageLimit)
        ORDER BY c.validUntil ASC, c.createdAt DESC
    """)
    List<Coupon> findPublicActiveCoupons(
            @Param("status") CouponStatus status,
            @Param("now") Instant now,
            Pageable pageable
    );

    @Query("""
        SELECT c FROM Coupon c
        WHERE c.airlineId = :airlineId
          AND (:status IS NULL OR c.status = :status)
          AND (
            :keyword IS NULL
            OR LOWER(c.code) LIKE :keyword
            OR LOWER(c.description) LIKE :keyword
          )
    """)
    Page<Coupon> searchOwnedCoupons(
            @Param("airlineId") Long airlineId,
            @Param("status") CouponStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
