package com.triquang.event;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.triquang.enums.DeliveryChannel;
import com.triquang.enums.NotificationType;
import com.triquang.message.PasswordResetRequestedEvent;
import com.triquang.service.EmailService;
import com.triquang.service.NotificationIdempotencyService;
import com.triquang.service.NotificationTrackingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserNotificationListener {

    private final EmailService emailService;
    private final NotificationIdempotencyService idempotencyService;
    private final NotificationTrackingService trackingService;

    @Value("${notification.password-reset-url}")
    private String passwordResetUrl;

    @KafkaListener(
            topics = "${kafka.topics.password-reset-requested:user.password-reset-requested}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handlePasswordResetRequested(PasswordResetRequestedEvent event) {
        log.info("Password reset notification requested email={}", event.getEmail());

        String businessKey = businessKey(event);
        String subject = "Reset your FlightHub password";

        try {
            idempotencyService.runOnce(
                    "password-reset:" + businessKey,
                    () -> trackingService.sendTracked(
                            NotificationType.PASSWORD_RESET_REQUESTED,
                            businessKey,
                            DeliveryChannel.EMAIL,
                            event.getEmail(),
                            subject,
                            "Password reset link requested",
                            event,
                            () -> emailService.sendPasswordReset(event, passwordResetUrl)
                    )
            );
        } catch (Exception ex) {
            log.error("Password reset notification failed email={}", event.getEmail(), ex);
            throw new RuntimeException(ex);
        }
    }

    private String businessKey(PasswordResetRequestedEvent event) {
        String requestedAt = event.getRequestedAt() != null ? event.getRequestedAt().toString() : "unknown-time";
        return valueOrUnknown(event.getEmail()) + ":" + requestedAt;
    }

    private String valueOrUnknown(String value) {
        return value != null && !value.isBlank() ? value : "unknown";
    }
}
