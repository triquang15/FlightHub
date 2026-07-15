package com.triquang.message;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationFailureAlertEvent {
    private String eventId;
    private String recipientEmail;
    private String severity;
    private String serviceName;
    private String summary;
    private String details;
    private Integer failedCount;
    private LocalDateTime detectedAt;
    private String dashboardUrl;
}
