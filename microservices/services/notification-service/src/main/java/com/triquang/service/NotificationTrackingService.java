package com.triquang.service;

import java.time.LocalDateTime;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.triquang.enums.DeliveryChannel;
import com.triquang.enums.DeliveryStatus;
import com.triquang.enums.NotificationType;
import com.triquang.model.NotificationDelivery;
import com.triquang.model.NotificationEvent;
import com.triquang.repository.NotificationDeliveryRepository;
import com.triquang.repository.NotificationEventRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationTrackingService {

    private final NotificationEventRepository eventRepository;
    private final NotificationDeliveryRepository deliveryRepository;
    private final ObjectMapper objectMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendTracked(
            NotificationType type,
            String businessKey,
            DeliveryChannel channel,
            String recipient,
            String subject,
            String content,
            Object payload,
            NotificationSender sender
    ) throws Exception {
        String normalizedBusinessKey = normalizeBusinessKey(businessKey);
        String eventKey = type + ":" + normalizedBusinessKey;
        String deliveryKey = eventKey + ":" + channel + ":" + recipient;

        NotificationEvent event = getOrCreateEvent(type, normalizedBusinessKey, eventKey, payload);
        NotificationDelivery delivery = getOrCreateDelivery(event, deliveryKey, channel, recipient, subject, content);

        if (delivery.getStatus() == DeliveryStatus.SENT) {
            log.info("Notification delivery already sent key={}", deliveryKey);
            return;
        }

        markProcessing(delivery);

        try {
            sender.send();
            markSent(delivery);
        } catch (Exception ex) {
            markFailed(delivery, ex);
            throw ex;
        }
    }

    private NotificationEvent getOrCreateEvent(
            NotificationType type,
            String businessKey,
            String eventKey,
            Object payload
    ) {
        return eventRepository.findByEventKey(eventKey)
                .orElseGet(() -> {
                    try {
                        return eventRepository.saveAndFlush(NotificationEvent.builder()
                                .eventKey(eventKey)
                                .type(type)
                                .businessKey(businessKey)
                                .sourceService(sourceService(type))
                                .payloadJson(writePayload(payload))
                                .build());
                    } catch (DataIntegrityViolationException ex) {
                        return eventRepository.findByEventKey(eventKey).orElseThrow(() -> ex);
                    }
                });
    }

    private NotificationDelivery getOrCreateDelivery(
            NotificationEvent event,
            String deliveryKey,
            DeliveryChannel channel,
            String recipient,
            String subject,
            String content
    ) {
        return deliveryRepository.findByDeliveryKey(deliveryKey)
                .orElseGet(() -> {
                    try {
                        return deliveryRepository.saveAndFlush(NotificationDelivery.builder()
                                .event(event)
                                .deliveryKey(deliveryKey)
                                .channel(channel)
                                .status(DeliveryStatus.PENDING)
                                .recipient(recipient)
                                .subject(subject)
                                .content(content)
                                .attempts(0)
                                .build());
                    } catch (DataIntegrityViolationException ex) {
                        return deliveryRepository.findByDeliveryKey(deliveryKey).orElseThrow(() -> ex);
                    }
                });
    }

    private void markProcessing(NotificationDelivery delivery) {
        delivery.setStatus(DeliveryStatus.PROCESSING);
        delivery.setAttempts(delivery.getAttempts() + 1);
        delivery.setLastError(null);
        deliveryRepository.saveAndFlush(delivery);
    }

    private void markSent(NotificationDelivery delivery) {
        delivery.setStatus(DeliveryStatus.SENT);
        delivery.setSentAt(LocalDateTime.now());
        delivery.setLastError(null);
        deliveryRepository.saveAndFlush(delivery);
    }

    private void markFailed(NotificationDelivery delivery, Exception ex) {
        delivery.setStatus(DeliveryStatus.FAILED);
        delivery.setLastError(ex.getMessage());
        deliveryRepository.saveAndFlush(delivery);
    }

    private String normalizeBusinessKey(String businessKey) {
        return businessKey != null && !businessKey.isBlank() ? businessKey : "unknown";
    }

    private String sourceService(NotificationType type) {
        return switch (type) {
            case BOOKING_CONFIRMED -> "booking-service";
            case PASSWORD_RESET_REQUESTED, SUSPICIOUS_LOGIN -> "user-service";
        };
    }

    private String writePayload(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            return "{}";
        }
    }

    @FunctionalInterface
    public interface NotificationSender {
        void send() throws Exception;
    }
}
