package com.triquang.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notification Admin", description = "Inspect notification events, delivery attempts, failed messages, and retry/delete delivery operations.")
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
    @Operation(summary = "Get notification overview", description = "Returns aggregate notification and delivery health metrics for the admin dashboard.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Overview returned")
    })
    public ResponseEntity<ApiResponse<NotificationOverviewResponse>> overview() {
        return ResponseUtil.ok(notificationAdminService.overview());
    }

    @GetMapping("/events")
    @Operation(summary = "Search notification events", description = "Returns paginated notification events with optional type and text filters.")
    public ResponseEntity<ApiResponse<Page<NotificationEventResponse>>> events(
            @Parameter(description = "Optional notification type filter.")
            @RequestParam(required = false) NotificationType type,
            @Parameter(description = "Optional recipient, subject, or payload search text.")
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
    @Operation(summary = "Search notification deliveries", description = "Returns paginated delivery attempts with optional status, channel, type, and text filters.")
    public ResponseEntity<ApiResponse<Page<NotificationDeliveryResponse>>> deliveries(
            @Parameter(description = "Optional delivery status filter.")
            @RequestParam(required = false) DeliveryStatus status,
            @Parameter(description = "Optional channel filter such as EMAIL, SMS, or PUSH.")
            @RequestParam(required = false) DeliveryChannel channel,
            @Parameter(description = "Optional notification type filter.")
            @RequestParam(required = false) NotificationType type,
            @Parameter(description = "Optional recipient or provider reference search text.")
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
    @Operation(summary = "List failed deliveries", description = "Returns failed delivery attempts ordered by latest update for operational retry handling.")
    public ResponseEntity<ApiResponse<Page<NotificationDeliveryResponse>>> failedDeliveries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseUtil.ok(notificationAdminService.getFailedDeliveries(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"))
        ));
    }

    @PostMapping("/deliveries/{deliveryId}/retry")
    @Operation(summary = "Retry notification delivery", description = "Queues or immediately retries a failed notification delivery and returns retry metadata.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Retry requested"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Delivery not found")
    })
    public ResponseEntity<ApiResponse<NotificationRetryResponse>> retryDelivery(@PathVariable Long deliveryId) {
        return ResponseUtil.ok(notificationAdminService.retryDelivery(deliveryId));
    }

    @DeleteMapping("/deliveries/{deliveryId}")
    @Operation(summary = "Delete notification delivery", description = "Deletes a delivery record from the admin view. Use with care because this removes retry/audit context.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Delivery deleted"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Delivery not found")
    })
    public ResponseEntity<ApiResponse<String>> deleteDelivery(@PathVariable Long deliveryId) {
        notificationAdminService.deleteDelivery(deliveryId);
        return ResponseUtil.ok("Notification delivery deleted");
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
