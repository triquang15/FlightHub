package com.triquang.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.triquang.enums.PaymentGateway;
import com.triquang.enums.PaymentStatus;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Cross-service ref: User (user-service)
    @Column(name = "user_id")
    private Long userId;

    // Cross-service ref: Booking (booking-service)
    @Column(name = "booking_id")
    private Long bookingId;

    @Column(precision = 19, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(length = 3, nullable = false)
    private String currency;

    @Enumerated(EnumType.STRING)
    private PaymentGateway provider;

    private String providerPaymentId;
    private String providerCheckoutId;
    private String transactionId;
    private String method;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private String failureReason;
    private LocalDateTime paidAt;
    private LocalDateTime expiresAt;
    private String refundId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
