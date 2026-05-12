package com.triquang.event;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.triquang.message.SuspiciousLoginEvent;
import com.triquang.service.EmailService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityEventConsumer {

    private final EmailService emailService;

    @KafkaListener(
            topics = "security.suspicious-login",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handle(SuspiciousLoginEvent event) {

        log.warn("🔐 Suspicious login → {}", event.getEmail());

        try {
            emailService.send(
                    event.getEmail(),
                    "Suspicious Login Alert",
                    "Device: " + event.getDeviceId() + " IP: " + event.getIp()
            );

        } catch (Exception e) {
            log.error("❌ Processing failed", e);
            throw new RuntimeException(e); // retry + DLQ
        }
    }

    @KafkaListener(
            topics = "security.suspicious-login.DLQ",
            groupId = "notification-dlq-group"
    )
    public void handleDLQ(ConsumerRecord<String, Object> record) {

        log.error("💀 DLQ EVENT → {}", record.value());
    }
}