package com.triquang.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.triquang.message.BookingConfirmedEvent;
import com.triquang.enums.DeliveryChannel;
import com.triquang.enums.NotificationType;
import com.triquang.service.EmailService;
import com.triquang.service.NotificationIdempotencyService;
import com.triquang.service.NotificationTrackingService;
import com.triquang.service.SmsService;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingNotificationListener {

    private final EmailService emailService;
    private final SmsService smsService;
    private final NotificationIdempotencyService idempotencyService;
    private final NotificationTrackingService trackingService;

    @KafkaListener(
            topics = "${kafka.topics.booking-confirmed:booking.confirmed}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleBookingConfirmed(BookingConfirmedEvent event) {

        log.info("Booking confirmation notification requested booking={}", event.getBookingReference());

        try {
            if (event.getContactEmail() != null) {
                idempotencyService.runOnce(
                        notificationKey(event, "email"),
                        () -> trackingService.sendTracked(
                                NotificationType.BOOKING_CONFIRMED,
                                businessKey(event),
                                DeliveryChannel.EMAIL,
                                event.getContactEmail(),
                                emailSubject(event),
                                "Booking confirmation email",
                                event,
                                () -> emailService.sendBookingConfirmation(event)
                        )
                );
            }

            if (event.getContactPhone() != null && smsService.isEnabled()) {
                idempotencyService.runOnce(
                        notificationKey(event, "sms"),
                        () -> trackingService.sendTracked(
                                NotificationType.BOOKING_CONFIRMED,
                                businessKey(event),
                                DeliveryChannel.SMS,
                                event.getContactPhone(),
                                "Booking confirmation SMS",
                                "Booking confirmation SMS",
                                event,
                                () -> smsService.sendBookingConfirmation(event)
                        )
                );
            } else if (event.getContactPhone() != null) {
                log.info("Booking confirmation SMS skipped because provider is disabled booking={}", event.getBookingReference());
            }

        } catch (Exception e) {
            log.error("Booking notification processing failed booking={}", event.getBookingReference(), e);
            throw new RuntimeException(e); // 🔥 retry + DLQ
        }
    }

    private String notificationKey(BookingConfirmedEvent event, String channel) {
        return "booking-confirmed:" + businessKey(event) + ":" + channel;
    }

    private String businessKey(BookingConfirmedEvent event) {
        String bookingKey = firstNonBlank(
                event.getBookingReference(),
                event.getProviderPaymentId(),
                event.getTransactionId(),
                event.getBookingId() != null ? String.valueOf(event.getBookingId()) : null
        );

        return bookingKey;
    }

    private String emailSubject(BookingConfirmedEvent event) {
        return "Booking confirmed | " + businessKey(event);
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
