package com.triquang.service.gateway;

import com.triquang.enums.PaymentGateway;

public record ProviderWebhookEvent(
        String eventId,
        String eventType,
        PaymentGateway gateway,
        PaymentVerificationResult verification,
        boolean terminalFailure) {
}
