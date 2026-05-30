package com.triquang.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.triquang.message.BookingConfirmedEvent;
import com.triquang.service.EmailService;
import com.triquang.service.NotificationIdempotencyService;
import com.triquang.service.SmsService;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingNotificationListener {

    private final EmailService emailService;
    private final SmsService smsService;
    private final NotificationIdempotencyService idempotencyService;

    @KafkaListener(
            topics = "booking.confirmed",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleBookingConfirmed(BookingConfirmedEvent event) {

        log.info("📦 BookingConfirmed → {}", event.getBookingReference());

        try {
            if (event.getContactEmail() != null) {
                idempotencyService.runOnce(
                        notificationKey(event, "email"),
                        () -> emailService.sendBookingConfirmation(event)
                );
            }

            if (event.getContactPhone() != null) {
                idempotencyService.runOnce(
                        notificationKey(event, "sms"),
                        () -> smsService.sendBookingConfirmation(event)
                );
            }

        } catch (Exception e) {
            log.error("❌ Booking processing failed", e);
            throw new RuntimeException(e); // 🔥 retry + DLQ
        }
    }

    private String notificationKey(BookingConfirmedEvent event, String channel) {
        String bookingKey = firstNonBlank(
                event.getBookingReference(),
                event.getProviderPaymentId(),
                event.getTransactionId(),
                event.getBookingId() != null ? String.valueOf(event.getBookingId()) : null
        );

        return "booking-confirmed:" + bookingKey + ":" + channel;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }

        return "unknown-booking";
    }
}
