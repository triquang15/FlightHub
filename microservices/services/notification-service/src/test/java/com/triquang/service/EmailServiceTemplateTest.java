package com.triquang.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import com.triquang.enums.UserRole;
import com.triquang.message.AdminUserProvisionedEvent;
import com.triquang.message.AirlineOnboardingDecisionEvent;
import com.triquang.message.BookingConfirmedEvent;
import com.triquang.message.BookingLegNotificationData;
import com.triquang.message.BookingRefundedNotificationEvent;
import com.triquang.message.FlightScheduleChangedNotificationEvent;
import com.triquang.message.NotificationFailureAlertEvent;
import com.triquang.message.PassengerNotificationData;
import com.triquang.message.PasswordResetRequestedEvent;
import com.triquang.message.PaymentFailedNotificationEvent;
import com.triquang.message.SuspiciousLoginEvent;
import com.triquang.message.TicketIssuedEvent;

import jakarta.mail.internet.MimeMessage;

@ExtendWith(MockitoExtension.class)
class EmailServiceTemplateTest {

    @Mock
    private JavaMailSender mailSender;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(mailSender, templateEngine());
        ReflectionTestUtils.setField(emailService, "fromEmail", "noreply@flighthub.local");
        ReflectionTestUtils.setField(emailService, "fromName", "FlightHub");
        ReflectionTestUtils.setField(emailService, "supportEmail", "support@flighthub.local");
        ReflectionTestUtils.setField(emailService, "frontendBaseUrl", "http://localhost:5173");
    }

    @Test
    void rendersBookingConfirmationTemplate() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage());

        emailService.sendBookingConfirmation(bookingEvent());

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void rendersPasswordResetTemplate() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage());

        emailService.sendPasswordReset(passwordResetEvent(), "http://localhost:5173/reset-password");

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void rendersSuspiciousLoginTemplate() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage());

        emailService.sendSuspiciousLogin(suspiciousLoginEvent());

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void rendersPaymentFailedTemplate() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage());

        emailService.sendPaymentFailed(paymentFailedEvent());

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void rendersBookingRefundedTemplate() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage());

        emailService.sendBookingRefunded(bookingRefundedEvent());

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void rendersTicketIssuedTemplate() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage());

        emailService.sendTicketIssued(ticketIssuedEvent());

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void rendersFlightScheduleChangedTemplate() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage());

        emailService.sendFlightScheduleChanged(flightScheduleChangedEvent());

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void rendersAirlineOnboardingDecisionTemplate() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage());

        emailService.sendAirlineOnboardingDecision(airlineOnboardingDecisionEvent());

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void rendersAdminUserProvisionedTemplate() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage());

        emailService.sendAdminUserProvisioned(adminUserProvisionedEvent());

        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void rendersNotificationFailureAlertTemplate() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage());

        emailService.sendNotificationFailureAlert(notificationFailureAlertEvent());

        verify(mailSender).send(any(MimeMessage.class));
    }

    private MimeMessage mimeMessage() {
        return new org.springframework.mail.javamail.JavaMailSenderImpl().createMimeMessage();
    }

    private TemplateEngine templateEngine() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(false);

        TemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        return engine;
    }

    private BookingConfirmedEvent bookingEvent() {
        return BookingConfirmedEvent.builder()
                .bookingId(42L)
                .bookingReference("BKTEST42")
                .userName("Test Traveller")
                .contactEmail("traveller@example.com")
                .contactPhone("+84900000000")
                .bookingDate(LocalDateTime.of(2026, 7, 15, 9, 30))
                .confirmedAt(LocalDateTime.of(2026, 7, 15, 9, 35))
                .tripType("ROUND_TRIP")
                .cabinClass("ECONOMY")
                .currency("USD")
                .paymentGateway("Stripe")
                .transactionId("txn_test")
                .paidAt(LocalDateTime.of(2026, 7, 15, 9, 36))
                .totalAmount(BigDecimal.valueOf(198.55))
                .baseFare(150.00)
                .taxesAndFees(28.55)
                .seatFees(10.00)
                .ancillaryFees(5.00)
                .mealFees(5.00)
                .checkinBaggagePieces(1)
                .checkinBaggageWeightPerPiece(20.0)
                .cabinBaggagePieces(1)
                .cabinBaggageWeightPerPiece(7.0)
                .passengers(List.of(PassengerNotificationData.builder()
                        .firstName("Test")
                        .lastName("Traveller")
                        .adult(true)
                        .seatNumber("12A")
                        .ticketNumber("TKT42")
                        .build()))
                .legs(List.of(
                        BookingLegNotificationData.builder()
                                .label("Departure")
                                .flightNumber("VN211")
                                .airlineName("Vietnam Airlines")
                                .aircraftModel("Airbus A321neo")
                                .departureAirportCode("SGN")
                                .departureAirportName("Tan Son Nhat International Airport")
                                .departureCity("Ho Chi Minh City")
                                .departureDate("15 Jul 2026")
                                .departureTime("09:30")
                                .arrivalAirportCode("HAN")
                                .arrivalAirportName("Noi Bai International Airport")
                                .arrivalCity("Hanoi")
                                .arrivalDate("15 Jul 2026")
                                .arrivalTime("11:40")
                                .duration("2h 10m")
                                .cabinClass("Economy")
                                .fareName("Standard")
                                .build(),
                        BookingLegNotificationData.builder()
                                .label("Return")
                                .flightNumber("VN212")
                                .airlineName("Vietnam Airlines")
                                .departureAirportCode("HAN")
                                .departureAirportName("Noi Bai International Airport")
                                .departureCity("Hanoi")
                                .departureDate("18 Jul 2026")
                                .departureTime("14:00")
                                .arrivalAirportCode("SGN")
                                .arrivalAirportName("Tan Son Nhat International Airport")
                                .arrivalCity("Ho Chi Minh City")
                                .arrivalDate("18 Jul 2026")
                                .arrivalTime("16:10")
                                .duration("2h 10m")
                                .cabinClass("Economy")
                                .fareName("Standard")
                                .build()
                ))
                .build();
    }

    private PasswordResetRequestedEvent passwordResetEvent() {
        return PasswordResetRequestedEvent.builder()
                .eventId("reset-1")
                .email("traveller@example.com")
                .fullName("Test Traveller")
                .resetToken("reset-token")
                .requestedAt(LocalDateTime.of(2026, 7, 15, 9, 30))
                .expiresAt(LocalDateTime.of(2026, 7, 15, 9, 45))
                .build();
    }

    private SuspiciousLoginEvent suspiciousLoginEvent() {
        return SuspiciousLoginEvent.builder()
                .eventId("security-1")
                .email("traveller@example.com")
                .deviceId("chrome-macos")
                .ip("127.0.0.1")
                .timestamp(LocalDateTime.of(2026, 7, 15, 9, 30))
                .build();
    }

    private PaymentFailedNotificationEvent paymentFailedEvent() {
        return PaymentFailedNotificationEvent.builder()
                .eventId("payment-failed-1")
                .bookingId(42L)
                .bookingReference("BKTEST42")
                .userName("Test Traveller")
                .contactEmail("traveller@example.com")
                .amount(BigDecimal.valueOf(198.55))
                .currency("USD")
                .paymentGateway("Stripe")
                .failureReason("Payment verification failed")
                .failedAt(LocalDateTime.of(2026, 7, 15, 9, 40))
                .manageBookingUrl("http://localhost:5173/bookings")
                .build();
    }

    private BookingRefundedNotificationEvent bookingRefundedEvent() {
        return BookingRefundedNotificationEvent.builder()
                .eventId("refund-1")
                .bookingId(42L)
                .bookingReference("BKTEST42")
                .userName("Test Traveller")
                .contactEmail("traveller@example.com")
                .amount(BigDecimal.valueOf(198.55))
                .currency("USD")
                .paymentGateway("Stripe")
                .refundId("re_test")
                .refundedAt(LocalDateTime.of(2026, 7, 15, 10, 0))
                .manageBookingUrl("http://localhost:5173/bookings")
                .build();
    }

    private TicketIssuedEvent ticketIssuedEvent() {
        BookingConfirmedEvent booking = bookingEvent();
        return TicketIssuedEvent.builder()
                .eventId("ticket-issued-1")
                .bookingId(booking.getBookingId())
                .bookingReference(booking.getBookingReference())
                .userName(booking.getUserName())
                .contactEmail(booking.getContactEmail())
                .tripType(booking.getTripType())
                .cabinClass(booking.getCabinClass())
                .legs(booking.getLegs())
                .passengers(booking.getPassengers())
                .issuedAt(LocalDateTime.of(2026, 7, 15, 9, 45))
                .viewTicketUrl("http://localhost:5173/view-ticket/42")
                .manageBookingUrl("http://localhost:5173/bookings")
                .build();
    }

    private FlightScheduleChangedNotificationEvent flightScheduleChangedEvent() {
        return FlightScheduleChangedNotificationEvent.builder()
                .eventId("schedule-1")
                .bookingId(42L)
                .bookingReference("BKTEST42")
                .userName("Test Traveller")
                .contactEmail("traveller@example.com")
                .flightInstanceId(100L)
                .flightNumber("VN211")
                .oldStatus("SCHEDULED")
                .newStatus("DELAYED")
                .oldDepartureDateTime(LocalDateTime.of(2026, 7, 15, 9, 30))
                .newDepartureDateTime(LocalDateTime.of(2026, 7, 15, 10, 15))
                .oldArrivalDateTime(LocalDateTime.of(2026, 7, 15, 11, 40))
                .newArrivalDateTime(LocalDateTime.of(2026, 7, 15, 12, 25))
                .oldGate("C05")
                .newGate("D03")
                .oldTerminal("T1")
                .newTerminal("T1")
                .changedAt(LocalDateTime.of(2026, 7, 15, 8, 0))
                .manageBookingUrl("http://localhost:5173/bookings")
                .build();
    }

    private AirlineOnboardingDecisionEvent airlineOnboardingDecisionEvent() {
        return AirlineOnboardingDecisionEvent.builder()
                .eventId("airline-decision-1")
                .airlineId(9L)
                .airlineName("Vietnam Airlines")
                .ownerEmail("owner@example.com")
                .ownerName("Airline Owner")
                .status("ACTIVE")
                .decision("APPROVED")
                .reason("Your airline has been approved.")
                .decidedAt(LocalDateTime.of(2026, 7, 15, 9, 0))
                .workspaceUrl("http://localhost:5173/airline")
                .build();
    }

    private AdminUserProvisionedEvent adminUserProvisionedEvent() {
        return AdminUserProvisionedEvent.builder()
                .eventId("admin-user-1")
                .userId(7L)
                .email("owner@example.com")
                .fullName("Airline Owner")
                .role(UserRole.ROLE_AIRLINE_OWNER)
                .createdAt(LocalDateTime.of(2026, 7, 15, 9, 0))
                .loginUrl("http://localhost:5173/login")
                .build();
    }

    private NotificationFailureAlertEvent notificationFailureAlertEvent() {
        return NotificationFailureAlertEvent.builder()
                .eventId("ops-alert-1")
                .recipientEmail("admin@example.com")
                .severity("HIGH")
                .serviceName("notification-service")
                .summary("Email provider failures increased")
                .details("Five email deliveries failed in the last 15 minutes.")
                .failedCount(5)
                .detectedAt(LocalDateTime.of(2026, 7, 15, 9, 0))
                .dashboardUrl("http://localhost:5173/super-admin/notifications")
                .build();
    }
}
