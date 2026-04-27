package com.triquang.payload.request;

import lombok.Data;


@Data
public class PaymentVerifyRequest {

    private Long paymentId;

    // Stripe
    private String stripeSessionId;

    // Paypal
    private String paypalOrderId;
}
