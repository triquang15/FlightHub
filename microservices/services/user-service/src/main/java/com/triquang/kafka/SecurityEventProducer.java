package com.triquang.kafka;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.triquang.message.SuspiciousLoginEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.suspicious-login}")
    private String topic;

    public void sendSuspiciousLoginEvent(SuspiciousLoginEvent event) {

        kafkaTemplate.send(topic, event.getEmail(), event)
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
}