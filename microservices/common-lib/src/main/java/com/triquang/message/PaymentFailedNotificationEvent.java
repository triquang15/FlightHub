package com.triquang.message;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentFailedNotificationEvent {
    private String eventId;
    private Long bookingId;
    private String bookingReference;
    private Long userId;
    private String userName;
    private String contactEmail;
    private String contactPhone;
    private BigDecimal amount;
    private String currency;
    private String paymentGateway;
    private String transactionId;
    private String failureReason;
    private LocalDateTime failedAt;
    private String manageBookingUrl;
}
