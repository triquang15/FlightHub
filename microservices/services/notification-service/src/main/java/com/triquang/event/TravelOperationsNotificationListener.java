package com.triquang.event;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.triquang.enums.DeliveryChannel;
import com.triquang.enums.NotificationType;
import com.triquang.message.AdminUserProvisionedEvent;
import com.triquang.message.AirlineOnboardingDecisionEvent;
import com.triquang.message.FlightScheduleChangedNotificationEvent;
import com.triquang.message.NotificationFailureAlertEvent;
import com.triquang.message.TicketIssuedEvent;
import com.triquang.service.EmailService;
import com.triquang.service.NotificationIdempotencyService;
import com.triquang.service.NotificationTrackingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class TravelOperationsNotificationListener {

    private final EmailService emailService;
    private final NotificationIdempotencyService idempotencyService;
    private final NotificationTrackingService trackingService;

    @KafkaListener(topics = "${kafka.topics.ticket-issued:booking.ticket-issued}", containerFactory = "kafkaListenerContainerFactory")
    public void handleTicketIssued(TicketIssuedEvent event) {
        sendEmail(
                NotificationType.TICKET_ISSUED,
                "ticket-issued",
                key(event.getEventId(), event.getBookingReference(), event.getBookingId()),
                event.getContactEmail(),
                "Your ticket is ready | " + fallback(event.getBookingReference(), "booking"),
                "Ticket issued notification",
                event,
                () -> emailService.sendTicketIssued(event)
        );
    }

    @KafkaListener(topics = "${kafka.topics.flight-schedule-changed-notification:flight.schedule-changed.notification}", containerFactory = "kafkaListenerContainerFactory")
    public void handleFlightScheduleChanged(FlightScheduleChangedNotificationEvent event) {
        sendEmail(
                NotificationType.FLIGHT_SCHEDULE_CHANGED,
                "flight-schedule-changed",
                key(event.getEventId(), event.getBookingReference(), event.getBookingId()),
                event.getContactEmail(),
                "Flight schedule updated | " + fallback(event.getBookingReference(), "booking"),
                "Flight schedule changed notification",
                event,
                () -> emailService.sendFlightScheduleChanged(event)
        );
    }

    @KafkaListener(topics = "${kafka.topics.airline-onboarding-decision:airline.onboarding-decision}", containerFactory = "kafkaListenerContainerFactory")
    public void handleAirlineOnboardingDecision(AirlineOnboardingDecisionEvent event) {
        sendEmail(
                NotificationType.AIRLINE_ONBOARDING_DECISION,
                "airline-onboarding-decision",
                key(event.getEventId(), event.getAirlineName(), event.getAirlineId()),
                event.getOwnerEmail(),
                "Airline onboarding update | " + fallback(event.getAirlineName(), "airline"),
                "Airline onboarding decision notification",
                event,
                () -> emailService.sendAirlineOnboardingDecision(event)
        );
    }

    @KafkaListener(topics = "${kafka.topics.admin-user-provisioned:user.admin-provisioned}", containerFactory = "kafkaListenerContainerFactory")
    public void handleAdminUserProvisioned(AdminUserProvisionedEvent event) {
        sendEmail(
                NotificationType.ADMIN_USER_PROVISIONED,
                "admin-user-provisioned",
                key(event.getEventId(), event.getEmail(), event.getUserId()),
                event.getEmail(),
                "Your FlightHub admin account is ready",
                "Admin user provisioned notification",
                event,
                () -> emailService.sendAdminUserProvisioned(event)
        );
    }

    @KafkaListener(topics = "${kafka.topics.notification-failure-alert:notification.failure-alert}", containerFactory = "kafkaListenerContainerFactory")
    public void handleNotificationFailureAlert(NotificationFailureAlertEvent event) {
        sendEmail(
                NotificationType.NOTIFICATION_FAILURE_ALERT,
                "notification-failure-alert",
                key(event.getEventId(), event.getSummary(), null),
                event.getRecipientEmail(),
                "Notification delivery alert | " + fallback(event.getSeverity(), "ALERT"),
                "Notification failure alert",
                event,
                () -> emailService.sendNotificationFailureAlert(event)
        );
    }

    private void sendEmail(
            NotificationType type,
            String idempotencyPrefix,
            String businessKey,
            String recipient,
            String subject,
            String content,
            Object payload,
            NotificationTrackingService.NotificationSender sender
    ) {
        if (recipient == null || recipient.isBlank()) {
            log.warn("Notification skipped because recipient is missing type={} businessKey={}", type, businessKey);
            return;
        }

        try {
            idempotencyService.runOnce(
                    idempotencyPrefix + ":" + businessKey + ":email",
                    () -> trackingService.sendTracked(
                            type,
                            businessKey,
                            DeliveryChannel.EMAIL,
                            recipient,
                            subject,
                            content,
                            payload,
                            sender
                    )
            );
        } catch (Exception ex) {
            log.error("Notification processing failed type={} businessKey={}", type, businessKey, ex);
            throw new RuntimeException(ex);
        }
    }

    private String key(String eventId, String fallback, Long id) {
        if (eventId != null && !eventId.isBlank()) {
            return eventId;
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback;
        }
        return id != null ? String.valueOf(id) : "unknown";
    }

    private String fallback(String value, String fallback) {
        return value != null && !value.isBlank() ? value : fallback;
    }
}
