package com.triquang.service.gateway;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.stripe.Stripe;
import com.stripe.net.Webhook;
import com.stripe.net.RequestOptions;
import com.stripe.model.Event;
import com.stripe.model.Refund;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import com.triquang.dto.UserDTO;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.model.Payment;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class StripeService {

    private static final Set<String> ZERO_DECIMAL_CURRENCIES = Set.of(
            "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA",
            "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"
    );

    @Value("${payment.stripe.secret-key}")
    private String stripeKey;

    @Value("${payment.stripe.webhook-secret:}")
    private String webhookSecret;

    @Value("${payment.checkout.success-url}")
    private String successUrl;

    @Value("${payment.checkout.cancel-url}")
    private String cancelUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeKey;
    }

    public PaymentCheckoutResult createCheckoutSession(Payment payment, UserDTO user) {

        try {

            SessionCreateParams params =
                    SessionCreateParams.builder()
                            .setMode(SessionCreateParams.Mode.PAYMENT)
                            .setExpiresAt(payment.getExpiresAt().atZone(java.time.ZoneId.systemDefault()).toEpochSecond())
                            .setSuccessUrl(successUrl(payment) + "&session_id={CHECKOUT_SESSION_ID}")
                            .setCancelUrl(cancelUrl(payment))
                            .addLineItem(
                                    SessionCreateParams.LineItem.builder()
                                            .setQuantity(1L)
                                            .setPriceData(
                                                            SessionCreateParams.LineItem.PriceData.builder()
                                                                    .setCurrency(payment.getCurrency().toLowerCase())
                                                            .setUnitAmount(toMinorUnits(payment.getAmount(), payment.getCurrency()))
                                                            .setProductData(
                                                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                            .setName("Booking " + payment.getBookingId())
                                                                            .build()
                                                            )
                                                            .build()
                                            )
                                            .build()
                            )
                            .putMetadata("payment_id", String.valueOf(payment.getId()))
                            .build();

            Session session = Session.create(params, RequestOptions.builder()
                    .setIdempotencyKey("checkout-" + payment.getTransactionId())
                    .build());

            return new PaymentCheckoutResult(session.getUrl(), session.getId());

        } catch (Exception e) {
            log.error("Stripe create session failed", e);
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    public PaymentVerificationResult verifyPayment(String sessionId) {

        try {
            Session session = Session.retrieve(sessionId);

            return toVerificationResult(session);

        } catch (Exception e) {
            log.error("Stripe verify failed", e);
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    public ProviderWebhookEvent parseWebhook(String payload, String signature) {
        try {
            Event event = Webhook.constructEvent(payload, signature, webhookSecret);
            boolean supported = event.getType().equals("checkout.session.completed")
                    || event.getType().equals("checkout.session.async_payment_succeeded")
                    || event.getType().equals("checkout.session.async_payment_failed")
                    || event.getType().equals("checkout.session.expired");
            if (!supported) {
                return new ProviderWebhookEvent(event.getId(), event.getType(),
                        com.triquang.enums.PaymentGateway.STRIPE, null, false);
            }

            StripeObject object = event.getDataObjectDeserializer().getObject()
                    .orElse(event.getDataObjectDeserializer().deserializeUnsafe());
            if (!(object instanceof Session session)) {
                throw new BaseException(ErrorCode.INVALID_INPUT);
            }

            PaymentVerificationResult verification = toVerificationResult(Session.retrieve(session.getId()));
            boolean terminalFailure = event.getType().equals("checkout.session.async_payment_failed")
                    || event.getType().equals("checkout.session.expired");
            return new ProviderWebhookEvent(event.getId(), event.getType(),
                    com.triquang.enums.PaymentGateway.STRIPE, verification, terminalFailure);
        } catch (Exception e) {
            log.warn("Stripe webhook validation failed: {}", e.getMessage());
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }

    public String refund(String paymentIntentId, String idempotencyKey) {
        try {
            Refund refund = Refund.create(
                    RefundCreateParams.builder().setPaymentIntent(paymentIntentId).build(),
                    RequestOptions.builder().setIdempotencyKey(idempotencyKey).build());
            return refund.getId();
        } catch (Exception e) {
            log.error("Stripe refund failed for payment intent {}", paymentIntentId, e);
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }
    }

    public void expireCheckout(String checkoutId) {
        try {
            Session.retrieve(checkoutId).expire();
        } catch (Exception e) {
            log.warn("Could not expire Stripe checkout {}: {}", checkoutId, e.getMessage());
        }
    }

    private PaymentVerificationResult toVerificationResult(Session session) {
        Long paymentId = parsePaymentId(session.getMetadata().get("payment_id"));
        BigDecimal amount = session.getAmountTotal() == null
                ? null
                : fromMinorUnits(session.getAmountTotal(), session.getCurrency());

        return new PaymentVerificationResult(
                "paid".equalsIgnoreCase(session.getPaymentStatus()),
                session.getId(),
                session.getPaymentIntent(),
                paymentId,
                amount,
                session.getCurrency());
    }

    private long toMinorUnits(BigDecimal amount, String currency) {
        BigDecimal decimalAmount = amount;
        if (isZeroDecimalCurrency(currency)) {
            return decimalAmount.setScale(0, RoundingMode.HALF_UP).longValueExact();
        }

        return decimalAmount.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    private BigDecimal fromMinorUnits(Long amount, String currency) {
        BigDecimal minorAmount = BigDecimal.valueOf(amount);
        if (isZeroDecimalCurrency(currency)) {
            return minorAmount;
        }

        return minorAmount.movePointLeft(2);
    }

    private boolean isZeroDecimalCurrency(String currency) {
        return currency != null && ZERO_DECIMAL_CURRENCIES.contains(currency.toUpperCase());
    }

    private Long parsePaymentId(String value) {
        try {
            return value == null ? null : Long.valueOf(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String successUrl(Payment payment) {
        return successUrl.replace("{bookingId}", payment.getBookingId().toString())
                + "?paymentId=" + payment.getId();
    }

    private String cancelUrl(Payment payment) {
        return cancelUrl.replace("{bookingId}", payment.getBookingId().toString());
    }
}
