package com.triquang.kafka;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.triquang.message.PasswordResetRequestedEvent;
import com.triquang.message.SuspiciousLoginEvent;
import com.triquang.message.AdminUserProvisionedEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.suspicious-login}")
    private String suspiciousLoginTopic;

    @Value("${kafka.topics.password-reset-requested}")
    private String passwordResetTopic;

    @Value("${kafka.topics.admin-user-provisioned:user.admin-provisioned}")
    private String adminUserProvisionedTopic;

    public void sendSuspiciousLoginEvent(SuspiciousLoginEvent event) {

        kafkaTemplate.send(suspiciousLoginTopic, event.getEmail(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("❌ Kafka send FAILED → key={}", event.getEmail(), ex);
                    } else {
                        var metadata = result.getRecordMetadata();

                        log.info("✅ Kafka send OK → key={}, topic={}, partition={}, offset={}",
                                event.getEmail(),
                                metadata.topic(),
                                metadata.partition(),
                                metadata.offset());
                    }
                });
    }

    public void sendPasswordResetRequestedEvent(PasswordResetRequestedEvent event) {

        kafkaTemplate.send(passwordResetTopic, event.getEmail(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Kafka password reset send FAILED key={}", event.getEmail(), ex);
                    } else {
                        var metadata = result.getRecordMetadata();

                        log.info("Kafka password reset send OK key={}, topic={}, partition={}, offset={}",
                                event.getEmail(),
                                metadata.topic(),
                                metadata.partition(),
                                metadata.offset());
                    }
                });
    }

    public void sendAdminUserProvisionedEvent(AdminUserProvisionedEvent event) {
        kafkaTemplate.send(adminUserProvisionedTopic, event.getEmail(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Kafka admin user provisioned send FAILED key={}", event.getEmail(), ex);
                    } else {
                        var metadata = result.getRecordMetadata();
                        log.info("Kafka admin user provisioned send OK key={}, topic={}, partition={}, offset={}",
                                event.getEmail(), metadata.topic(), metadata.partition(), metadata.offset());
                    }
                });
    }
}
