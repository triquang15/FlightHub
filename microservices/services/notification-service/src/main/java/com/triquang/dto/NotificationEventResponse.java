package com.triquang.dto;

import java.time.LocalDateTime;

import com.triquang.enums.NotificationType;
import com.triquang.model.NotificationEvent;

public record NotificationEventResponse(
        Long id,
        String eventKey,
        NotificationType type,
        String businessKey,
        String sourceService,
        long totalDeliveries,
        long sentDeliveries,
        long failedDeliveries,
        long pendingDeliveries,
        long processingDeliveries,
        long skippedDuplicateDeliveries,
        long totalAttempts,
        LocalDateTime lastDeliveryAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static NotificationEventResponse from(NotificationEvent event) {
        return from(event, DeliverySummary.empty());
    }

    public static NotificationEventResponse from(NotificationEvent event, DeliverySummary summary) {
        return new NotificationEventResponse(
                event.getId(),
                event.getEventKey(),
                event.getType(),
                event.getBusinessKey(),
                event.getSourceService(),
                summary.totalDeliveries(),
                summary.sentDeliveries(),
                summary.failedDeliveries(),
                summary.pendingDeliveries(),
                summary.processingDeliveries(),
                summary.skippedDuplicateDeliveries(),
                summary.totalAttempts(),
                summary.lastDeliveryAt(),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }

    public record DeliverySummary(
            long totalDeliveries,
            long sentDeliveries,
            long failedDeliveries,
            long pendingDeliveries,
            long processingDeliveries,
            long skippedDuplicateDeliveries,
            long totalAttempts,
            LocalDateTime lastDeliveryAt
    ) {
        public static DeliverySummary empty() {
            return new DeliverySummary(0, 0, 0, 0, 0, 0, 0, null);
        }
    }
}
