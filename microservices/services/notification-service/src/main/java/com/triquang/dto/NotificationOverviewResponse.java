package com.triquang.dto;

import java.util.Map;

import com.triquang.enums.DeliveryStatus;

public record NotificationOverviewResponse(
        long totalEvents,
        long totalDeliveries,
        Map<DeliveryStatus, Long> deliveriesByStatus
) {
}
