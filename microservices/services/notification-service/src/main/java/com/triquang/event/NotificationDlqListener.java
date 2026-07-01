package com.triquang.event;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class NotificationDlqListener {

    @KafkaListener(
            topics = {
                    "${kafka.topics.booking-confirmed-dlq:booking.confirmed.DLQ}",
                    "${kafka.topics.password-reset-requested-dlq:user.password-reset-requested.DLQ}",
                    "${kafka.topics.suspicious-login-dlq:security.suspicious-login.DLQ}"
            },
            groupId = "${kafka.groups.notification-dlq:notification-dlq-group}"
    )
    public void handle(ConsumerRecord<String, Object> record) {
        log.error(
                "Notification DLQ record topic={} partition={} offset={} key={} value={}",
                record.topic(),
                record.partition(),
                record.offset(),
                record.key(),
                record.value()
        );
    }
}
