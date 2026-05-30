package com.triquang.event;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.triquang.message.SuspiciousLoginEvent;
import com.triquang.service.EmailService;
import com.triquang.service.NotificationIdempotencyService;
import com.triquang.service.NotificationTrackingService;
import com.triquang.enums.DeliveryChannel;
import com.triquang.enums.NotificationType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityEventConsumer {

    private final EmailService emailService;
    private final NotificationIdempotencyService idempotencyService;
    private final NotificationTrackingService trackingService;

    @KafkaListener(
            topics = "${kafka.topics.suspicious-login:security.suspicious-login}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handle(SuspiciousLoginEvent event) {

        log.warn("🔐 Suspicious login → {}", event.getEmail());

        try {
            idempotencyService.runOnce(
                    notificationKey(event),
                    () -> trackingService.sendTracked(
                            NotificationType.SUSPICIOUS_LOGIN,
                            businessKey(event),
                            DeliveryChannel.EMAIL,
                            event.getEmail(),
                            "Suspicious Login Alert",
                            "Device: " + event.getDeviceId() + " IP: " + event.getIp(),
                            event,
                            () -> emailService.send(
                                    event.getEmail(),
                                    "Suspicious Login Alert",
                                    "Device: " + event.getDeviceId() + " IP: " + event.getIp()
                            )
                    )
            );

        } catch (Exception e) {
            log.error("❌ Processing failed", e);
            throw new RuntimeException(e); // retry + DLQ
        }
    }

    @KafkaListener(
            topics = "${kafka.topics.suspicious-login-dlq:security.suspicious-login.DLQ}",
            groupId = "${kafka.groups.notification-dlq:notification-dlq-group}"
    )
    public void handleDLQ(ConsumerRecord<String, Object> record) {

        log.error("💀 DLQ EVENT → {}", record.value());
    }

    private String notificationKey(SuspiciousLoginEvent event) {
        return "suspicious-login:" + businessKey(event);
    }

    private String businessKey(SuspiciousLoginEvent event) {
        String timestamp = event.getTimestamp() != null ? event.getTimestamp().toString() : "unknown-time";
        return valueOrUnknown(event.getEmail()) + ":"
                + valueOrUnknown(event.getDeviceId()) + ":"
                + valueOrUnknown(event.getIp()) + ":"
                + timestamp;
    }

    private String valueOrUnknown(String value) {
        return value != null && !value.isBlank() ? value : "unknown";
    }
}
