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
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static NotificationEventResponse from(NotificationEvent event) {
        return new NotificationEventResponse(
                event.getId(),
                event.getEventKey(),
                event.getType(),
                event.getBusinessKey(),
                event.getSourceService(),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }
}
