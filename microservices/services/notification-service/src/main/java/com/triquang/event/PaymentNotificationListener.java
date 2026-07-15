package com.triquang.event;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.triquang.enums.DeliveryChannel;
import com.triquang.enums.NotificationType;
import com.triquang.message.BookingRefundedNotificationEvent;
import com.triquang.message.PaymentFailedNotificationEvent;
import com.triquang.service.EmailService;
import com.triquang.service.NotificationIdempotencyService;
import com.triquang.service.NotificationTrackingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentNotificationListener {

    private final EmailService emailService;
    private final NotificationIdempotencyService idempotencyService;
    private final NotificationTrackingService trackingService;

    @KafkaListener(
            topics = "${kafka.topics.payment-failed-notification:payment.failed.notification}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handlePaymentFailed(PaymentFailedNotificationEvent event) {
        String businessKey = businessKey(event.getEventId(), event.getBookingReference(), event.getBookingId());
        log.warn("Payment failed notification requested booking={}", businessKey);

        if (isBlank(event.getContactEmail())) {
            log.warn("Payment failed notification skipped because recipient is missing booking={}", businessKey);
            return;
        }

        try {
            idempotencyService.runOnce(
                    "payment-failed:" + businessKey + ":email",
                    () -> trackingService.sendTracked(
                            NotificationType.PAYMENT_FAILED,
                            businessKey,
                            DeliveryChannel.EMAIL,
                            event.getContactEmail(),
                            "Payment could not be completed | " + businessKey,
                            "Payment failure notification",
                            event,
                            () -> emailService.sendPaymentFailed(event)
                    )
            );
        } catch (Exception ex) {
            log.error("Payment failed notification processing failed booking={}", businessKey, ex);
            throw new RuntimeException(ex);
        }
    }

    @KafkaListener(
            topics = "${kafka.topics.booking-refunded-notification:booking.refunded.notification}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleBookingRefunded(BookingRefundedNotificationEvent event) {
        String businessKey = businessKey(event.getEventId(), event.getBookingReference(), event.getBookingId());
        log.info("Booking refund notification requested booking={}", businessKey);

        if (isBlank(event.getContactEmail())) {
            log.warn("Booking refund notification skipped because recipient is missing booking={}", businessKey);
            return;
        }

        try {
            idempotencyService.runOnce(
                    "booking-refunded:" + businessKey + ":email",
                    () -> trackingService.sendTracked(
                            NotificationType.BOOKING_REFUNDED,
                            businessKey,
                            DeliveryChannel.EMAIL,
                            event.getContactEmail(),
                            "Refund initiated | " + businessKey,
                            "Booking refund notification",
                            event,
                            () -> emailService.sendBookingRefunded(event)
                    )
            );
        } catch (Exception ex) {
            log.error("Booking refund notification processing failed booking={}", businessKey, ex);
            throw new RuntimeException(ex);
        }
    }

    private String businessKey(String eventId, String bookingReference, Long bookingId) {
        if (!isBlank(eventId)) {
            return eventId;
        }
        if (!isBlank(bookingReference)) {
            return bookingReference;
        }
        return bookingId != null ? String.valueOf(bookingId) : "unknown-booking";
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
