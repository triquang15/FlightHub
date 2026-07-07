package com.triquang.dto;

import java.util.Map;

import com.triquang.enums.DeliveryChannel;
import com.triquang.enums.DeliveryStatus;
import com.triquang.enums.NotificationType;

public record NotificationOverviewResponse(
        long totalEvents,
        long totalDeliveries,
        Map<DeliveryStatus, Long> deliveriesByStatus,
        Map<DeliveryChannel, Long> deliveriesByChannel,
        Map<NotificationType, Long> eventsByType
) {
}
