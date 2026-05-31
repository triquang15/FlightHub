package com.triquang.dto;

public record NotificationRetryResponse(
        Long deliveryId,
        String status,
        String message
) {
}
