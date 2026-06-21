package com.triquang.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.triquang.message.PaymentCompletedEvent;
import com.triquang.message.PaymentFailedEvent;
import com.triquang.message.PaymentRefundedEvent;
import com.triquang.model.Payment;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.payment-completed:payment.completed}")
    private String paymentCompletedTopic;

    @Value("${kafka.topics.payment-failed:payment.failed}")
    private String paymentFailedTopic;

    @Value("${kafka.topics.payment-refunded:payment.refunded}")
    private String paymentRefundedTopic;

    public void sendPaymentCompleted(Payment payment) {
        PaymentCompletedEvent event = PaymentCompletedEvent.builder()
                .paymentId(payment.getId())
                .bookingId(payment.getBookingId())
                .userId(payment.getUserId())
                .amount(payment.getAmount())
                .paymentGateway(payment.getProvider() != null ? payment.getProvider().name() : null)
                .transactionId(payment.getTransactionId())
                .providerPaymentId(payment.getProviderPaymentId())
                .paidAt(payment.getPaidAt())
                .build();

        kafkaTemplate.send(paymentCompletedTopic, event);
        log.info("Published PaymentCompletedEvent for payment ID: {}, booking ID: {}",
                payment.getId(), payment.getBookingId());
    }

    public void sendPaymentFailed(Payment payment) {
        PaymentFailedEvent event = PaymentFailedEvent.builder()
                .paymentId(payment.getId())
                .bookingId(payment.getBookingId())
                .userId(payment.getUserId())
                .amount(payment.getAmount())
                .paymentGateway(payment.getProvider() != null ? payment.getProvider().name() : null)
                .transactionId(payment.getTransactionId())
                .failureReason(payment.getFailureReason())
                .failedAt(LocalDateTime.now())
                .build();

        kafkaTemplate.send(paymentFailedTopic, event);
        log.warn("Published PaymentFailedEvent for payment ID: {} - Reason: {}",
                payment.getId(), payment.getFailureReason());
    }

    public void sendPaymentRefunded(Payment payment) {
        PaymentRefundedEvent event = PaymentRefundedEvent.builder()
                .paymentId(payment.getId())
                .bookingId(payment.getBookingId())
                .userId(payment.getUserId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .paymentGateway(payment.getProvider() != null ? payment.getProvider().name() : null)
                .providerPaymentId(payment.getProviderPaymentId())
                .refundId(payment.getRefundId())
                .refundedAt(LocalDateTime.now())
                .build();
        kafkaTemplate.send(paymentRefundedTopic, event);
        log.info("Published PaymentRefundedEvent for payment ID: {}", payment.getId());
    }
}
