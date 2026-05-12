package com.triquang.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.triquang.message.BookingConfirmedEvent;
import com.triquang.service.EmailService;
import com.triquang.service.SmsService;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingNotificationListener {

    private final EmailService emailService;
    private final SmsService smsService;

    @KafkaListener(
            topics = "booking.confirmed",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleBookingConfirmed(BookingConfirmedEvent event) {

        log.info("📦 BookingConfirmed → {}", event.getBookingReference());

        try {
            if (event.getContactEmail() != null) {
                emailService.sendBookingConfirmation(event);
            }

            if (event.getContactPhone() != null) {
                smsService.sendBookingConfirmation(event);
            }

        } catch (Exception e) {
            log.error("❌ Booking processing failed", e);
            throw new RuntimeException(e); // 🔥 retry + DLQ
        }
    }
}