package com.triquang.event;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.triquang.dto.UserDTO;
import com.triquang.message.AirlineOnboardingDecisionEvent;
import com.triquang.model.Airline;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AirlineNotificationProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topics.airline-onboarding-decision:airline.onboarding-decision}")
    private String airlineOnboardingDecisionTopic;

    @Value("${app.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public void sendOnboardingDecision(Airline airline, UserDTO owner, String decision, String reason) {
        AirlineOnboardingDecisionEvent event = AirlineOnboardingDecisionEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .airlineId(airline.getId())
                .airlineName(airline.getName())
                .ownerId(airline.getOwnerId())
                .ownerEmail(owner != null ? owner.getEmail() : null)
                .ownerName(owner != null ? owner.getFullName() : null)
                .status(airline.getStatus() != null ? airline.getStatus().name() : null)
                .decision(decision)
                .reason(reason)
                .decidedAt(LocalDateTime.now())
                .workspaceUrl(frontendBaseUrl + "/airline")
                .build();

        kafkaTemplate.send(airlineOnboardingDecisionTopic, String.valueOf(airline.getId()), event);
        log.info("Published AirlineOnboardingDecisionEvent airlineId={} decision={}", airline.getId(), decision);
    }
}
