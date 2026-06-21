package com.triquang.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.triquang.client.UserClient;
import com.triquang.enums.PaymentGateway;
import com.triquang.enums.PaymentStatus;
import com.triquang.enums.UserRole;
import com.triquang.event.PaymentEventProducer;
import com.triquang.exception.BaseException;
import com.triquang.model.Payment;
import com.triquang.payload.request.PaymentVerifyRequest;
import com.triquang.repository.PaymentRepository;
import com.triquang.service.gateway.PaypalService;
import com.triquang.service.gateway.PaymentVerificationResult;
import com.triquang.service.gateway.ProviderWebhookEvent;
import com.triquang.service.gateway.StripeService;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    private static final BigDecimal AMOUNT = new BigDecimal("1250.00");

    @Mock private PaymentRepository paymentRepository;
    @Mock private PaymentEventProducer paymentEventProducer;
    @Mock private UserClient userClient;
    @Mock private StripeService stripeService;
    @Mock private PaypalService paypalService;

    @InjectMocks private PaymentServiceImpl paymentService;

    private Payment payment;
    private PaymentVerifyRequest request;

    @BeforeEach
    void setUp() {
        payment = Payment.builder()
                .id(10L)
                .userId(7L)
                .bookingId(20L)
                .provider(PaymentGateway.STRIPE)
                .status(PaymentStatus.PENDING)
                .amount(AMOUNT)
                .currency("USD")
                .providerCheckoutId("cs_test_123")
                .build();
        request = new PaymentVerifyRequest();
        request.setPaymentId(10L);
        request.setStripeSessionId("cs_test_123");
        org.mockito.Mockito.lenient().when(paymentRepository.findByIdForUpdate(10L))
                .thenReturn(Optional.of(payment));
    }

    @Test
    void verifyPaymentConfirmsMatchingProviderTransaction() {
        when(stripeService.verifyPayment("cs_test_123"))
                .thenReturn(new PaymentVerificationResult(true, "cs_test_123", "pi_123", 10L, AMOUNT, "usd"));
        when(paymentRepository.save(payment)).thenReturn(payment);

        paymentService.verifyPayment(request, 7L);

        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        assertEquals("pi_123", payment.getProviderPaymentId());
        verify(paymentEventProducer).sendPaymentCompleted(payment);
    }

    @Test
    void verifyPaymentKeepsPendingWhenProviderIsNotCompleted() {
        when(stripeService.verifyPayment("cs_test_123"))
                .thenReturn(new PaymentVerificationResult(false, "cs_test_123", null, 10L, AMOUNT, "usd"));

        assertThrows(BaseException.class, () -> paymentService.verifyPayment(request, 7L));

        assertEquals(PaymentStatus.PENDING, payment.getStatus());
        verify(paymentRepository, never()).save(payment);
        verify(paymentEventProducer, never()).sendPaymentFailed(payment);
    }

    @Test
    void verifyPaymentRejectsCompletedTransactionForAnotherPayment() {
        when(stripeService.verifyPayment("cs_test_123"))
                .thenReturn(new PaymentVerificationResult(true, "cs_test_123", "pi_123", 99L, AMOUNT, "usd"));
        when(paymentRepository.save(payment)).thenReturn(payment);

        assertThrows(BaseException.class, () -> paymentService.verifyPayment(request, 7L));

        assertEquals(PaymentStatus.FAILED, payment.getStatus());
        verify(paymentEventProducer).sendPaymentFailed(payment);
    }

    @Test
    void verifyPaymentRejectsAnotherUser() {
        assertThrows(BaseException.class, () -> paymentService.verifyPayment(request, 8L));

        verify(stripeService, never()).verifyPayment("cs_test_123");
    }

    @Test
    void webhookCompletesPaymentOnlyOnce() {
        PaymentVerificationResult verification =
                new PaymentVerificationResult(true, "cs_test_123", "pi_123", 10L, AMOUNT, "USD");
        ProviderWebhookEvent event = new ProviderWebhookEvent(
                "evt_1", "checkout.session.completed", PaymentGateway.STRIPE, verification, false);
        when(paymentRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(payment)).thenReturn(payment);

        paymentService.processWebhook(event);
        paymentService.processWebhook(event);

        assertEquals(PaymentStatus.SUCCESS, payment.getStatus());
        verify(paymentEventProducer).sendPaymentCompleted(payment);
    }

    @Test
    void webhookRefundsPaymentCapturedAfterLocalCancellation() {
        payment.setStatus(PaymentStatus.CANCELLED);
        PaymentVerificationResult verification =
                new PaymentVerificationResult(true, "cs_test_123", "pi_late", 10L, AMOUNT, "USD");
        ProviderWebhookEvent event = new ProviderWebhookEvent(
                "evt_late", "checkout.session.completed", PaymentGateway.STRIPE, verification, false);
        when(stripeService.refund("pi_late", "refund-payment-10")).thenReturn("re_late");
        when(paymentRepository.save(payment)).thenReturn(payment);

        paymentService.processWebhook(event);

        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        assertEquals("re_late", payment.getRefundId());
        verify(paymentEventProducer).sendPaymentRefunded(payment);
    }

    @Test
    void refundUsesOriginalProviderReference() {
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setProviderPaymentId("pi_123");
        when(paymentRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(payment));
        when(stripeService.refund("pi_123", "refund-payment-10")).thenReturn("re_123");
        when(paymentRepository.save(payment)).thenReturn(payment);

        paymentService.refundPayment(10L, UserRole.ROLE_SYSTEM_ADMIN.name());

        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        assertEquals("re_123", payment.getRefundId());
        verify(paymentEventProducer).sendPaymentRefunded(payment);
    }

    @Test
    void refundRejectsNonAdmin() {
        assertThrows(BaseException.class,
                () -> paymentService.refundPayment(10L, UserRole.ROLE_CUSTOMER.name()));
        verify(stripeService, never()).refund("pi_123", "refund-payment-10");
    }

    @Test
    void reconciliationExpiresStalePendingPayment() {
        payment.setExpiresAt(java.time.LocalDateTime.now().minusMinutes(1));
        when(stripeService.verifyPayment("cs_test_123"))
                .thenReturn(new PaymentVerificationResult(
                        false, "cs_test_123", null, 10L, AMOUNT, "USD"));
        when(paymentRepository.save(payment)).thenReturn(payment);

        paymentService.reconcilePayment(10L);

        assertEquals(PaymentStatus.FAILED, payment.getStatus());
        verify(stripeService).expireCheckout("cs_test_123");
        verify(paymentEventProducer).sendPaymentFailed(payment);
    }
}
