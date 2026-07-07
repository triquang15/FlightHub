package com.triquang.service;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.triquang.dto.NotificationDeliveryResponse;
import com.triquang.dto.NotificationEventResponse;
import com.triquang.dto.NotificationOverviewResponse;
import com.triquang.dto.NotificationRetryResponse;
import com.triquang.enums.DeliveryChannel;
import com.triquang.enums.DeliveryStatus;
import com.triquang.enums.NotificationType;
import com.triquang.message.BookingConfirmedEvent;
import com.triquang.message.PasswordResetRequestedEvent;
import com.triquang.message.SuspiciousLoginEvent;
import com.triquang.model.NotificationDelivery;
import com.triquang.model.NotificationEvent;
import com.triquang.repository.NotificationDeliveryRepository;
import com.triquang.repository.NotificationEventRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NotificationAdminService {

    private final NotificationEventRepository eventRepository;
    private final NotificationDeliveryRepository deliveryRepository;
    private final EmailService emailService;
    private final SmsService smsService;
    private final ObjectMapper objectMapper;

    @Value("${notification.password-reset-url}")
    private String passwordResetUrl;

    @Transactional(readOnly = true)
    public NotificationOverviewResponse overview() {
        Map<DeliveryStatus, Long> deliveriesByStatus = new EnumMap<>(DeliveryStatus.class);
        for (DeliveryStatus status : DeliveryStatus.values()) {
            deliveriesByStatus.put(status, deliveryRepository.countByStatus(status));
        }

        Map<DeliveryChannel, Long> deliveriesByChannel = new EnumMap<>(DeliveryChannel.class);
        for (DeliveryChannel channel : DeliveryChannel.values()) {
            deliveriesByChannel.put(channel, deliveryRepository.countByChannel(channel));
        }

        Map<NotificationType, Long> eventsByType = new EnumMap<>(NotificationType.class);
        for (NotificationType type : NotificationType.values()) {
            eventsByType.put(type, eventRepository.countByType(type));
        }

        return new NotificationOverviewResponse(
                eventRepository.count(),
                deliveryRepository.count(),
                deliveriesByStatus,
                deliveriesByChannel,
                eventsByType
        );
    }

    @Transactional(readOnly = true)
    public Page<NotificationDeliveryResponse> getDeliveries(
            DeliveryStatus status,
            DeliveryChannel channel,
            NotificationType type,
            String search,
            Pageable pageable
    ) {
        return deliveryRepository.findAll(deliverySpec(status, channel, type, search), pageable)
                .map(NotificationDeliveryResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<NotificationDeliveryResponse> getFailedDeliveries(Pageable pageable) {
        return deliveryRepository.findByStatus(DeliveryStatus.FAILED, pageable)
                .map(NotificationDeliveryResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<NotificationEventResponse> getEvents(
            NotificationType type,
            String search,
            Pageable pageable
    ) {
        return eventRepository.findAll(eventSpec(type, search), pageable)
                .map(NotificationEventResponse::from);
    }

    public NotificationRetryResponse retryDelivery(Long deliveryId) {
        NotificationDelivery delivery = deliveryRepository.findWithEventById(deliveryId)
                .orElseThrow(() -> new EntityNotFoundException("Notification delivery not found: " + deliveryId));

        if (delivery.getStatus() == DeliveryStatus.SENT) {
            return new NotificationRetryResponse(deliveryId, delivery.getStatus().name(), "Delivery already sent");
        }

        markProcessing(delivery);

        try {
            resend(delivery);
            markSent(delivery);
            return new NotificationRetryResponse(deliveryId, DeliveryStatus.SENT.name(), "Delivery retried successfully");
        } catch (Exception ex) {
            markFailed(delivery, ex);
            throw new IllegalStateException("Notification retry failed: " + ex.getMessage(), ex);
        }
    }

    @Transactional
    public void deleteDelivery(Long deliveryId) {
        NotificationDelivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new EntityNotFoundException("Notification delivery not found: " + deliveryId));

        deliveryRepository.delete(delivery);
    }

    private Specification<NotificationDelivery> deliverySpec(
            DeliveryStatus status,
            DeliveryChannel channel,
            NotificationType type,
            String search
    ) {
        return (root, query, cb) -> {
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("event", JoinType.LEFT);
            }
            query.distinct(true);

            var predicates = cb.conjunction();

            if (status != null) {
                predicates = cb.and(predicates, cb.equal(root.get("status"), status));
            }
            if (channel != null) {
                predicates = cb.and(predicates, cb.equal(root.get("channel"), channel));
            }
            if (type != null) {
                predicates = cb.and(predicates, cb.equal(root.get("event").get("type"), type));
            }
            if (search != null && !search.isBlank()) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                predicates = cb.and(predicates, cb.or(
                        cb.like(cb.lower(root.get("deliveryKey")), keyword),
                        cb.like(cb.lower(root.get("recipient")), keyword),
                        cb.like(cb.lower(root.get("subject")), keyword),
                        cb.like(cb.lower(root.get("event").get("eventKey")), keyword),
                        cb.like(cb.lower(root.get("event").get("businessKey")), keyword)
                ));
            }

            return predicates;
        };
    }

    private Specification<NotificationEvent> eventSpec(NotificationType type, String search) {
        return (root, query, cb) -> {
            var predicates = cb.conjunction();

            if (type != null) {
                predicates = cb.and(predicates, cb.equal(root.get("type"), type));
            }
            if (search != null && !search.isBlank()) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                predicates = cb.and(predicates, cb.or(
                        cb.like(cb.lower(root.get("eventKey")), keyword),
                        cb.like(cb.lower(root.get("businessKey")), keyword),
                        cb.like(cb.lower(root.get("sourceService")), keyword)
                ));
            }

            return predicates;
        };
    }

    private void resend(NotificationDelivery delivery) throws Exception {
        NotificationEvent event = delivery.getEvent();

        switch (event.getType()) {
            case PASSWORD_RESET_REQUESTED -> {
                ensureEmailDelivery(delivery);
                PasswordResetRequestedEvent payload = readPayload(event, PasswordResetRequestedEvent.class);
                ensurePasswordResetStillValid(payload);
                emailService.sendPasswordReset(payload, passwordResetUrl);
            }
            case SUSPICIOUS_LOGIN -> {
                ensureEmailDelivery(delivery);
                SuspiciousLoginEvent payload = readPayload(event, SuspiciousLoginEvent.class);
                emailService.sendSuspiciousLogin(payload);
            }
            case BOOKING_CONFIRMED -> {
                BookingConfirmedEvent payload = readPayload(event, BookingConfirmedEvent.class);
                if (delivery.getChannel() == DeliveryChannel.EMAIL) {
                    emailService.sendBookingConfirmation(payload);
                } else {
                    ensureSmsEnabled();
                    smsService.sendBookingConfirmation(payload);
                }
            }
        }
    }

    private void ensureEmailDelivery(NotificationDelivery delivery) {
        if (delivery.getChannel() != DeliveryChannel.EMAIL) {
            throw new IllegalStateException("Notification type only supports EMAIL retry");
        }
    }

    private void ensureSmsEnabled() {
        if (!smsService.isEnabled()) {
            throw new IllegalStateException("SMS provider is disabled");
        }
    }

    private void ensurePasswordResetStillValid(PasswordResetRequestedEvent payload) {
        if (payload.getExpiresAt() != null && payload.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Password reset link has expired; request a new reset instead");
        }
    }

    private <T> T readPayload(NotificationEvent event, Class<T> payloadType) throws Exception {
        if (event.getPayloadJson() == null || event.getPayloadJson().isBlank()) {
            throw new IllegalStateException("Notification event payload is empty");
        }

        return objectMapper.readValue(event.getPayloadJson(), payloadType);
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
}
