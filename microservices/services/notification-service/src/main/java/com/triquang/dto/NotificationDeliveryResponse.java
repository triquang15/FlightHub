package com.triquang.dto;

import java.time.LocalDateTime;

import com.triquang.enums.DeliveryChannel;
import com.triquang.enums.DeliveryStatus;
import com.triquang.enums.NotificationType;
import com.triquang.model.NotificationDelivery;

public record NotificationDeliveryResponse(
        Long id,
        Long eventId,
        String eventKey,
        NotificationType type,
        String businessKey,
        String sourceService,
        String deliveryKey,
        DeliveryChannel channel,
        DeliveryStatus status,
        String recipient,
        String subject,
        int attempts,
        String lastError,
        LocalDateTime sentAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static NotificationDeliveryResponse from(NotificationDelivery delivery) {
        var event = delivery.getEvent();

        return new NotificationDeliveryResponse(
                delivery.getId(),
                event.getId(),
                event.getEventKey(),
                event.getType(),
                event.getBusinessKey(),
                event.getSourceService(),
                delivery.getDeliveryKey(),
                delivery.getChannel(),
                delivery.getStatus(),
                delivery.getRecipient(),
                delivery.getSubject(),
                delivery.getAttempts(),
                delivery.getLastError(),
                delivery.getSentAt(),
                delivery.getCreatedAt(),
                delivery.getUpdatedAt()
        );
    }
}
