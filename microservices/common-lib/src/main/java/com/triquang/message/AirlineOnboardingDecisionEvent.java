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
public class AirlineOnboardingDecisionEvent {
    private String eventId;
    private Long airlineId;
    private String airlineName;
    private Long ownerId;
    private String ownerEmail;
    private String ownerName;
    private String status;
    private String decision;
    private String reason;
    private LocalDateTime decidedAt;
    private String workspaceUrl;
}
