package com.triquang.payload;

import lombok.*;

import java.time.LocalDateTime;
import java.math.BigDecimal;

import com.triquang.enums.PaymentGateway;
import com.triquang.enums.PaymentStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {

    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private Long bookingId;
    private PaymentStatus status;
    private PaymentGateway gateway;
    private BigDecimal amount;
    private String currency;
    private String transactionId;
    private String gatewayPaymentId;
    private String gatewayCheckoutId;
    private String gatewayOrderId;
    private String gatewaySignature;
    private String paymentMethod;
    private String description;
    private String failureReason;
    private Integer retryCount;
    private LocalDateTime initiatedAt;
    private LocalDateTime completedAt;
    private LocalDateTime expiresAt;
    private Boolean notificationSent;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
