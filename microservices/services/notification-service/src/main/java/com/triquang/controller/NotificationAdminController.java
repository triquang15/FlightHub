package com.triquang.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.dto.NotificationDeliveryResponse;
import com.triquang.dto.NotificationEventResponse;
import com.triquang.dto.NotificationOverviewResponse;
import com.triquang.dto.NotificationRetryResponse;
import com.triquang.enums.DeliveryChannel;
import com.triquang.enums.DeliveryStatus;
import com.triquang.enums.NotificationType;
import com.triquang.payload.response.ApiResponse;
import com.triquang.service.NotificationAdminService;
import com.triquang.utils.ResponseUtil;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationAdminController {

    private static final java.util.Set<String> ALLOWED_SORT_FIELDS = java.util.Set.of(
            "id",
            "createdAt",
            "updatedAt",
            "sentAt",
            "attempts",
            "status",
            "channel",
            "recipient"
    );

    private final NotificationAdminService notificationAdminService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<NotificationOverviewResponse>> overview() {
        return ResponseUtil.ok(notificationAdminService.overview());
    }

    @GetMapping("/events")
    public ResponseEntity<ApiResponse<Page<NotificationEventResponse>>> events(
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        return ResponseUtil.ok(notificationAdminService.getEvents(
                type,
                search,
                pageable(page, size, sortBy, direction)
        ));
    }

    @GetMapping("/deliveries")
    public ResponseEntity<ApiResponse<Page<NotificationDeliveryResponse>>> deliveries(
            @RequestParam(required = false) DeliveryStatus status,
            @RequestParam(required = false) DeliveryChannel channel,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        return ResponseUtil.ok(notificationAdminService.getDeliveries(
                status,
                channel,
                type,
                search,
                pageable(page, size, sortBy, direction)
        ));
    }

    @GetMapping("/deliveries/failed")
    public ResponseEntity<ApiResponse<Page<NotificationDeliveryResponse>>> failedDeliveries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseUtil.ok(notificationAdminService.getFailedDeliveries(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"))
        ));
    }

    @PostMapping("/deliveries/{deliveryId}/retry")
    public ResponseEntity<ApiResponse<NotificationRetryResponse>> retryDelivery(@PathVariable Long deliveryId) {
        return ResponseUtil.ok(notificationAdminService.retryDelivery(deliveryId));
    }

    private PageRequest pageable(int page, int size, String sortBy, String direction) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        String safeSortBy = ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "updatedAt";

        return PageRequest.of(safePage, safeSize, Sort.by(sortDirection, safeSortBy));
    }
}
