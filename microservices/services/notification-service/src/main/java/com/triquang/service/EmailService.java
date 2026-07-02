package com.triquang.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.triquang.message.BookingConfirmedEvent;
import com.triquang.message.BookingLegNotificationData;
import java.math.BigDecimal;
import com.triquang.message.PasswordResetRequestedEvent;
import com.triquang.message.SuspiciousLoginEvent;

import java.io.UnsupportedEncodingException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${notification.from-email}")
    private String fromEmail;

    @Value("${notification.from-name}")
    private String fromName;

    @Value("${notification.support-email}")
    private String supportEmail;

    @Value("${notification.frontend-base-url}")
    private String frontendBaseUrl;

    private static final DateTimeFormatter DATE_FMT   = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter TIME_FMT   = DateTimeFormatter.ofPattern("HH:mm", Locale.ENGLISH);
    private static final DateTimeFormatter DT_FMT     = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm", Locale.ENGLISH);

    public void sendBookingConfirmation(BookingConfirmedEvent event) throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail, fromName);
        helper.setTo(event.getContactEmail());
        helper.setSubject(buildSubject(event));
        helper.setText(buildHtmlBody(event), true);   // true = isHtml

        mailSender.send(message);
    }

    private String buildSubject(BookingConfirmedEvent event) {
        BookingLegNotificationData firstLeg = firstLeg(event);
        String depCode = firstLeg != null ? firstLeg.getDepartureAirportCode() : event.getDepartureAirportCode();
        String arrCode = firstLeg != null ? firstLeg.getArrivalAirportCode() : event.getArrivalAirportCode();
        String depDate = firstLeg != null ? firstLeg.getDepartureDate() :
                (event.getDepartureDateTime() != null ? event.getDepartureDateTime().format(DATE_FMT) : "");
        return String.format("Booking confirmed | %s | %s\u2192%s | %s",
                event.getBookingReference(),
                depCode,
                arrCode,
                depDate);
    }

    private String buildHtmlBody(BookingConfirmedEvent event) {
        Context ctx = new Context(Locale.ENGLISH);

        // Scalars
        ctx.setVariable("event", event);
        ctx.setVariable("passengerCount",
                event.getPassengers() != null ? event.getPassengers().size() : 1);
        ctx.setVariable("hasLegs", event.getLegs() != null && !event.getLegs().isEmpty());
        ctx.setVariable("tripTypeDisplay", tripTypeDisplay(event.getTripType()));
        ctx.setVariable("supportEmail", supportEmail);
        ctx.setVariable("manageBookingUrl", frontendBaseUrl + "/bookings");
        ctx.setVariable("viewTicketUrl", event.getBookingId() != null
                ? frontendBaseUrl + "/view-ticket/" + event.getBookingId()
                : frontendBaseUrl + "/bookings");

        // Formatted dates / times
        ctx.setVariable("depDate",
                event.getDepartureDateTime() != null ? event.getDepartureDateTime().format(DATE_FMT) : "N/A");
        ctx.setVariable("depTime",
                event.getDepartureDateTime() != null ? event.getDepartureDateTime().format(TIME_FMT) : "N/A");
        ctx.setVariable("arrDate",
                event.getArrivalDateTime() != null ? event.getArrivalDateTime().format(DATE_FMT) : "N/A");
        ctx.setVariable("arrTime",
                event.getArrivalDateTime() != null ? event.getArrivalDateTime().format(TIME_FMT) : "N/A");
        ctx.setVariable("paidAt",
                event.getPaidAt() != null ? event.getPaidAt().format(DT_FMT) : "N/A");
        ctx.setVariable("bookingDate",
                event.getBookingDate() != null ? event.getBookingDate().format(DT_FMT) : "N/A");

        // Fare breakdown helpers
        double base       = orZero(event.getBaseFare());
        double taxes      = orZero(event.getTaxesAndFees());
        double seats      = orZero(event.getSeatFees());
        double ancillary  = orZero(event.getAncillaryFees());
        double meals      = orZero(event.getMealFees());
        BigDecimal total  = orZero(event.getTotalAmount());

        ctx.setVariable("baseFareTotal",  fmt(base));
        ctx.setVariable("taxes",          fmt(taxes));
        ctx.setVariable("seatFees",       fmt(seats));
        ctx.setVariable("ancillaryFees",  fmt(ancillary));
        ctx.setVariable("mealFees",       fmt(meals));
        ctx.setVariable("totalAmount",    fmt(total));

        // Baggage helpers
        ctx.setVariable("hasBaggage",
                event.getCheckinBaggagePieces() != null || event.getCabinBaggagePieces() != null);
        ctx.setVariable("checkinBaggage", baggageLabel(
                event.getCheckinBaggagePieces(), event.getCheckinBaggageWeightPerPiece()));
        ctx.setVariable("cabinBaggage", baggageLabel(
                event.getCabinBaggagePieces(), event.getCabinBaggageWeightPerPiece()));

        // Cabin class display name
        ctx.setVariable("cabinClassDisplay", cabinDisplayName(event.getCabinClass()));
        ctx.setVariable("currency", event.getCurrency() != null && !event.getCurrency().isBlank()
                ? event.getCurrency()
                : "USD");

        return templateEngine.process("email/booking-confirmation", ctx);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static double orZero(Double v) {
        return v != null ? v : 0.0;
    }

    private static BigDecimal orZero(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private static String fmt(double v) {
        return String.format("%.2f", v);
    }

    private static String fmt(BigDecimal v) {
        return v.setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
    }

    private static String baggageLabel(Integer pieces, Double weightPer) {
        if (pieces == null && weightPer == null) return "Not included";
        if (pieces != null && weightPer != null)
            return pieces + " \u00d7 " + weightPer.intValue() + " kg";
        if (pieces != null) return pieces + " piece(s)";
        return weightPer.intValue() + " kg";
    }

    private static String cabinDisplayName(String cabinClass) {
        if (cabinClass == null) return "Economy";
        return switch (cabinClass) {
            case "ECONOMY"         -> "Economy";
            case "PREMIUM_ECONOMY" -> "Premium Economy";
            case "BUSINESS"        -> "Business";
            case "FIRST"           -> "First Class";
            default                -> cabinClass;
        };
    }

    private static BookingLegNotificationData firstLeg(BookingConfirmedEvent event) {
        List<BookingLegNotificationData> legs = event != null ? event.getLegs() : null;
        return legs != null && !legs.isEmpty() ? legs.getFirst() : null;
    }

    private static String tripTypeDisplay(String tripType) {
        if (tripType == null) return "One-way";
        return switch (tripType) {
            case "ROUND_TRIP" -> "Round trip";
            case "MULTI_CITY" -> "Multi-city";
            case "ONE_WAY" -> "One-way";
            default -> tripType.replace('_', ' ');
        };
    }

	public void send(String to, String subject, String content) throws MessagingException, UnsupportedEncodingException {
		MimeMessage message = mailSender.createMimeMessage();
		MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

		helper.setFrom(fromEmail, fromName);
		helper.setTo(to);
		helper.setSubject(subject);
		helper.setText(content, false);

		mailSender.send(message);
	}

    public void sendSuspiciousLogin(SuspiciousLoginEvent event)
            throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail, fromName);
        helper.setTo(event.getEmail());
        helper.setSubject("Security alert: new sign-in to your FlightHub account");
        helper.setText(buildSuspiciousLoginBody(event), true);

        mailSender.send(message);
    }

    private String buildSuspiciousLoginBody(SuspiciousLoginEvent event) {
        Context ctx = new Context(Locale.ENGLISH);
        ctx.setVariable("email", event.getEmail());
        ctx.setVariable("deviceId", valueOrUnknown(event.getDeviceId()));
        ctx.setVariable("ipAddress", valueOrUnknown(event.getIp()));
        ctx.setVariable("detectedAt", event.getTimestamp() != null ? event.getTimestamp().format(DT_FMT) : "Unknown time");
        ctx.setVariable("supportEmail", supportEmail);
        ctx.setVariable("frontendBaseUrl", frontendBaseUrl);

        return templateEngine.process("email/suspicious-login", ctx);
    }

    private String valueOrUnknown(String value) {
        return value != null && !value.isBlank() ? value : "Unknown";
    }

	public void sendPasswordReset(PasswordResetRequestedEvent event, String resetUrl)
			throws MessagingException, UnsupportedEncodingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail, fromName);
        helper.setTo(event.getEmail());
        helper.setSubject("Reset your FlightHub password");
        helper.setText(buildPasswordResetBody(event, resetUrl), true);

        mailSender.send(message);
	}

    private String buildPasswordResetBody(PasswordResetRequestedEvent event, String resetUrl) {
        String resetLink = buildResetLink(resetUrl, event.getResetToken());

        Context ctx = new Context(Locale.ENGLISH);
        ctx.setVariable("fullName", valueOrUnknown(event.getFullName()));
        ctx.setVariable("email", valueOrUnknown(event.getEmail()));
        ctx.setVariable("resetLink", resetLink);
        ctx.setVariable("expiresAt", event.getExpiresAt() != null ? event.getExpiresAt().format(DT_FMT) : "15 minutes");
        ctx.setVariable("requestedAt", event.getRequestedAt() != null ? event.getRequestedAt().format(DT_FMT) : "Unknown time");
        ctx.setVariable("supportEmail", supportEmail);
        ctx.setVariable("frontendBaseUrl", frontendBaseUrl);

        return templateEngine.process("email/password-reset", ctx);
    }

    private String buildResetLink(String resetUrl, String token) {
        String baseUrl = resetUrl != null && !resetUrl.isBlank()
                ? resetUrl.trim()
                : frontendBaseUrl + "/reset-password";

        String separator = baseUrl.contains("?") ? "&" : "?";
        return baseUrl + separator + "token=" + token;
    }
}
