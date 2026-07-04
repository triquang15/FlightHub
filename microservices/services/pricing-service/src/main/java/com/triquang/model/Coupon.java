package com.triquang.model;

import com.triquang.enums.CabinClassType;
import com.triquang.enums.CouponStatus;
import com.triquang.enums.DiscountType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(
        name = "coupons",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_coupons_airline_code", columnNames = {"airline_id", "code"})
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "airline_id", nullable = false)
    private Long airlineId;

    @Column(nullable = false, length = 32)
    private String code;

    @Column(nullable = false, length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DiscountType discountType;

    @Column(nullable = false)
    private Double discountValue;

    private Double minPurchaseAmount;

    private Double maxDiscountAmount;

    @Column(nullable = false)
    private Instant validFrom;

    @Column(nullable = false)
    private Instant validUntil;

    @Column(nullable = false)
    private Integer usageLimit;

    @Column(nullable = false)
    private Integer perUserLimit;

    @Builder.Default
    @Column(nullable = false)
    private Integer usedCount = 0;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CouponStatus status = CouponStatus.ACTIVE;

    @Builder.Default
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "coupon_cabin_classes", joinColumns = @JoinColumn(name = "coupon_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "cabin_class", length = 30)
    private Set<CabinClassType> applicableCabinClasses = new LinkedHashSet<>();

    @Builder.Default
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "coupon_routes", joinColumns = @JoinColumn(name = "coupon_id"))
    @Column(name = "route_id")
    private Set<Long> applicableRoutes = new LinkedHashSet<>();

    @Column(updatable = false, nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void preCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        this.code = normalizeCode(this.code);
        if (this.usedCount == null) this.usedCount = 0;
        if (this.status == null) this.status = CouponStatus.ACTIVE;
        if (this.applicableCabinClasses == null) this.applicableCabinClasses = new LinkedHashSet<>();
        if (this.applicableRoutes == null) this.applicableRoutes = new LinkedHashSet<>();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
        this.code = normalizeCode(this.code);
        if (this.usedCount == null) this.usedCount = 0;
        if (this.status == null) this.status = CouponStatus.ACTIVE;
        if (this.applicableCabinClasses == null) this.applicableCabinClasses = new LinkedHashSet<>();
        if (this.applicableRoutes == null) this.applicableRoutes = new LinkedHashSet<>();
    }

    public Integer getRemainingUsage() {
        if (usageLimit == null) return null;
        return Math.max(usageLimit - (usedCount == null ? 0 : usedCount), 0);
    }

    public static String normalizeCode(String code) {
        return code == null ? null : code.trim().toUpperCase();
    }
}
