package com.triquang.service.gateway;

import java.math.BigDecimal;

public record PaymentVerificationResult(
        boolean completed,
        String providerCheckoutId,
        String providerPaymentId,
        Long paymentId,
        BigDecimal amount,
        String currency) {
}
