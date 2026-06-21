package com.triquang.message;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentFailedEvent {
    private Long paymentId;
    private Long bookingId;
    private Long userId;
    private BigDecimal amount;
    private String paymentGateway;
    private String transactionId;
    private String failureReason;
    private LocalDateTime failedAt;
}
