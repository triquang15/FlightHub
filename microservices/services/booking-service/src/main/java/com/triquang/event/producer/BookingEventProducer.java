package com.triquang.event.producer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.triquang.dto.UserDTO;
import com.triquang.message.BookingConfirmedEvent;
import com.triquang.message.BookingLegNotificationData;
import com.triquang.message.BookingRefundedNotificationEvent;
import com.triquang.message.FlightScheduleChangedNotificationEvent;
import com.triquang.message.PassengerNotificationData;
import com.triquang.message.PaymentCompletedEvent;
import com.triquang.message.PaymentFailedEvent;
import com.triquang.message.PaymentFailedNotificationEvent;
import com.triquang.message.PaymentRefundedEvent;
import com.triquang.message.TicketIssuedEvent;
import com.triquang.model.Booking;
import com.triquang.model.BookingLeg;
import com.triquang.model.Passenger;
import com.triquang.model.Ticket;
import com.triquang.payload.response.AirportResponse;
import com.triquang.payload.response.BaggagePolicyResponse;
import com.triquang.payload.response.CityResponse;
import com.triquang.payload.response.FareResponse;
import com.triquang.payload.response.FlightInstanceResponse;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm", Locale.ENGLISH);

    @Value("${kafka.topics.booking-confirmed:booking.confirmed}")
    private String bookingConfirmedTopic;

    @Value("${kafka.topics.payment-failed-notification:payment.failed.notification}")
    private String paymentFailedNotificationTopic;

    @Value("${kafka.topics.booking-refunded-notification:booking.refunded.notification}")
    private String bookingRefundedNotificationTopic;

    @Value("${kafka.topics.ticket-issued:booking.ticket-issued}")
    private String ticketIssuedTopic;

    @Value("${kafka.topics.flight-schedule-changed-notification:flight.schedule-changed.notification}")
    private String flightScheduleChangedNotificationTopic;

    @Value("${notification.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public void sendBookingConfirmed(Booking booking,
                                     PaymentCompletedEvent payment,
                                     FlightInstanceResponse flight,
                                     Map<Long, FlightInstanceResponse> legFlightInstances,
                                     FareResponse fare,
                                     UserDTO user) {

        // ── Passengers ────────────────────────────────────────────────────────
        // Build a passengerId → ticketNumber lookup from the Ticket relation
        Map<Long, String> ticketByPassenger = booking.getTickets().stream()
                .filter(t -> t.getPassenger() != null)
                .collect(Collectors.toMap(
                        t -> t.getPassenger().getId(),
                        Ticket::getTicketNumber,
                        (a, b) -> a   // keep first if duplicate
                ));

        List<PassengerNotificationData> passengers = booking.getPassengers().stream()
                .map(p -> PassengerNotificationData.builder()
                        .firstName(p.getFirstName())
                        .lastName(p.getLastName())
                        .ticketNumber(ticketByPassenger.getOrDefault(p.getId(), "N/A"))
                        .passportNumber(p.getPassportNumber())
                        .nationality(p.getNationality())
                        .gender(p.getGender() != null ? p.getGender().name() : "")
                        .adult(p.isAdult())
                        .frequentFlyerNumber(p.getFrequentFlyerNumber())
                        .requiresWheelchair(Boolean.TRUE.equals(p.getRequiresWheelchairAssistance()))
                        .dietaryPreferences(p.getDietaryPreferences())
                        .build())
                .collect(Collectors.toList());

        // ── Contact Info ──────────────────────────────────────────────────────
        // Prefer booking.contactInfo; fall back to first passenger
        String contactEmail = booking.getContactInfo() != null
                ? booking.getContactInfo().getEmail() : null;
        String contactPhone = booking.getContactInfo() != null
                ? booking.getContactInfo().getPhone() : null;

        if (contactEmail == null || contactEmail.isBlank()) {
            contactEmail = booking.getPassengers().stream()
                    .map(Passenger::getEmail)
                    .filter(e -> e != null && !e.isBlank())
                    .findFirst().orElse(null);
        }
        if (contactPhone == null || contactPhone.isBlank()) {
            contactPhone = booking.getPassengers().stream()
                    .map(Passenger::getPhone)
                    .filter(p -> p != null && !p.isBlank())
                    .findFirst().orElse(null);
        }

        // ── Flight Details ─────────────────────────────────────────────────────
        String flightNumber   = flight != null ? flight.getFlightNumber()  : "N/A";
        String airlineName    = flight != null ? flight.getAirlineName()   : "N/A";
        String airlineLogo    = flight != null ? flight.getAirlineLogo()   : null;
        String aircraftModel  = flight != null ? flight.getAircraftModal() : null;
        String terminal       = flight != null ? flight.getTerminal()      : null;
        String gate           = flight != null ? flight.getGate()          : null;
        String duration       = flight != null ? flight.getFormattedDuration() : null;
        LocalDateTime depTime = flight != null ? flight.getDepartureDateTime() : null;
        LocalDateTime arrTime = flight != null ? flight.getArrivalDateTime()   : null;

        AirportResponse dep    = flight != null ? flight.getDepartureAirport() : null;
        CityResponse    depCity = dep != null ? dep.getCity() : null;
        String depCode         = dep != null ? dep.getIataCode()        : "N/A";
        String depName         = dep != null ? dep.getName()            : "N/A";
        String depCityName     = depCity != null ? depCity.getName()    : "N/A";
        String depCountry      = depCity != null ? depCity.getCountryName() : "N/A";

        AirportResponse arr     = flight != null ? flight.getArrivalAirport() : null;
        CityResponse    arrCity = arr != null ? arr.getCity() : null;
        String arrCode          = arr != null ? arr.getIataCode()        : "N/A";
        String arrName          = arr != null ? arr.getName()            : "N/A";
        String arrCityName      = arrCity != null ? arrCity.getName()    : "N/A";
        String arrCountry       = arrCity != null ? arrCity.getCountryName() : "N/A";

        // ── Fare & Baggage ────────────────────────────────────────────────────
        String fareName         = fare != null ? fare.getName()                     : null;
        Double baseFare         = fare != null ? fare.getBaseFare()                 : null;
        Double taxes            = fare != null ? fare.getTaxesAndFees()             : null;
        BaggagePolicyResponse bag = fare != null ? fare.getBaggagePolicy()          : null;
        Integer ciPieces        = bag  != null ? bag.getCheckInBaggagePieces()     : null;
        Double  ciWeightPer     = bag  != null ? bag.getCheckInBaggageWeightPerPiece() : null;
        Integer cbPieces        = bag  != null ? bag.getCabinBaggagePieces()        : null;
        Double  cbWeightPer     = bag  != null ? bag.getCabinBaggageWeightPerPiece() : null;
        List<BookingLegNotificationData> legs = buildLegs(booking, legFlightInstances, flight, fareName);

        // ── Build & Publish ───────────────────────────────────────────────────
        BookingConfirmedEvent event = BookingConfirmedEvent.builder()
                .bookingId(booking.getId())
                .bookingReference(booking.getBookingReference())
                .confirmedAt(LocalDateTime.now())
                .bookingDate(booking.getBookingDate())
                .cabinClass(booking.getCabinClass() != null ? booking.getCabinClass().name() : "ECONOMY")
                .tripType(booking.getTripType() != null ? booking.getTripType().name() : "ONE_WAY")
                .flexibleTicket(booking.isFlexibleTicket())
                // Contact
                .userId(booking.getUserId())
                .userName(user != null ? user.getFullName() : "Valued Customer")
                .contactEmail(contactEmail)
                .contactPhone(contactPhone)
                // Passengers
                .passengers(passengers)
                // Flight
                .legs(legs)
                .flightInstanceId(booking.getFlightInstanceId())
                .flightNumber(flightNumber)
                .airlineName(airlineName)
                .airlineLogo(airlineLogo)
                .aircraftModel(aircraftModel)
                .departureAirportCode(depCode)
                .departureAirportName(depName)
                .departureCity(depCityName)
                .departureCountry(depCountry)
                .departureTerminal(terminal)
                .departureGate(gate)
                .departureDateTime(depTime)
                .arrivalAirportCode(arrCode)
                .arrivalAirportName(arrName)
                .arrivalCity(arrCityName)
                .arrivalCountry(arrCountry)
                .arrivalDateTime(arrTime)
                .flightDuration(duration)
                // Payment
                .totalAmount(payment.getAmount())
                .currency(booking.getCurrency() != null ? booking.getCurrency() : "INR")
                .transactionId(payment.getTransactionId())
                .providerPaymentId(payment.getProviderPaymentId())
                .paymentGateway(payment.getPaymentGateway())
                .paidAt(payment.getPaidAt())
                // Fare breakdown
                .fareName(fareName)
                .baseFare(baseFare)
                .taxesAndFees(taxes)
                // Baggage
                .checkinBaggagePieces(ciPieces)
                .checkinBaggageWeightPerPiece(ciWeightPer)
                .cabinBaggagePieces(cbPieces)
                .cabinBaggageWeightPerPiece(cbWeightPer)
                // Policies
                .freeDateChange(fare != null ? fare.getFreeDateChange()       : null)
                .partialRefund(fare != null  ? fare.getPartialRefund()        : null)
                .fullRefund(fare != null     ? fare.getFullRefund()           : null)
                .priorityBoarding(fare != null ? fare.getPriorityBoarding()   : null)
                .loungeAccess(fare != null   ? fare.getLoungeAccess()         : null)
                .complimentaryMeals(fare != null ? fare.getComplimentaryMeals() : null)
                // Legacy — seat-service still reads this to mark seats BOOKED
                .seatInstanceIds(booking.getSeatInstanceIds())
                .build();

        kafkaTemplate.send(bookingConfirmedTopic, booking.getBookingReference(), event);
        sendTicketIssued(event);
        log.info("Published enriched BookingConfirmedEvent for booking={}", booking.getBookingReference());
    }

    public void sendPaymentFailed(Booking booking, PaymentFailedEvent payment, UserDTO user) {
        Contact contact = contact(booking);
        PaymentFailedNotificationEvent event = PaymentFailedNotificationEvent.builder()
                .eventId("payment-failed-" + booking.getBookingReference() + "-" + payment.getPaymentId())
                .bookingId(booking.getId())
                .bookingReference(booking.getBookingReference())
                .userId(booking.getUserId())
                .userName(user != null ? user.getFullName() : "Valued Customer")
                .contactEmail(contact.email())
                .contactPhone(contact.phone())
                .amount(payment.getAmount())
                .currency(booking.getCurrency() != null ? booking.getCurrency() : "USD")
                .paymentGateway(payment.getPaymentGateway())
                .transactionId(payment.getTransactionId())
                .failureReason(payment.getFailureReason())
                .failedAt(payment.getFailedAt() != null ? payment.getFailedAt() : LocalDateTime.now())
                .manageBookingUrl(frontendBaseUrl + "/bookings")
                .build();

        kafkaTemplate.send(paymentFailedNotificationTopic, booking.getBookingReference(), event);
        log.info("Published PaymentFailedNotificationEvent for booking={}", booking.getBookingReference());
    }

    public void sendBookingRefunded(Booking booking, PaymentRefundedEvent payment, UserDTO user) {
        Contact contact = contact(booking);
        BookingRefundedNotificationEvent event = BookingRefundedNotificationEvent.builder()
                .eventId("booking-refunded-" + booking.getBookingReference() + "-" + payment.getPaymentId())
                .bookingId(booking.getId())
                .bookingReference(booking.getBookingReference())
                .userId(booking.getUserId())
                .userName(user != null ? user.getFullName() : "Valued Customer")
                .contactEmail(contact.email())
                .contactPhone(contact.phone())
                .amount(payment.getAmount())
                .currency(payment.getCurrency() != null ? payment.getCurrency() : booking.getCurrency())
                .paymentGateway(payment.getPaymentGateway())
                .providerPaymentId(payment.getProviderPaymentId())
                .refundId(payment.getRefundId())
                .refundedAt(payment.getRefundedAt() != null ? payment.getRefundedAt() : LocalDateTime.now())
                .manageBookingUrl(frontendBaseUrl + "/bookings")
                .build();

        kafkaTemplate.send(bookingRefundedNotificationTopic, booking.getBookingReference(), event);
        log.info("Published BookingRefundedNotificationEvent for booking={}", booking.getBookingReference());
    }

    public void sendFlightScheduleChanged(Booking booking,
                                          com.triquang.message.FlightScheduleChangedEvent scheduleEvent,
                                          Map<Long, FlightInstanceResponse> legFlightInstances,
                                          FlightInstanceResponse primaryFlight,
                                          UserDTO user) {
        Contact contact = contact(booking);
        FlightScheduleChangedNotificationEvent event = FlightScheduleChangedNotificationEvent.builder()
                .eventId("flight-schedule-changed-" + booking.getBookingReference() + "-" + scheduleEvent.getFlightInstanceId())
                .bookingId(booking.getId())
                .bookingReference(booking.getBookingReference())
                .userId(booking.getUserId())
                .userName(user != null ? user.getFullName() : "Valued Customer")
                .contactEmail(contact.email())
                .contactPhone(contact.phone())
                .flightInstanceId(scheduleEvent.getFlightInstanceId())
                .flightNumber(scheduleEvent.getFlightNumber())
                .tripType(booking.getTripType() != null ? booking.getTripType().name() : "ONE_WAY")
                .legs(buildLegs(booking, legFlightInstances, primaryFlight, null))
                .oldStatus(scheduleEvent.getOldStatus())
                .newStatus(scheduleEvent.getNewStatus())
                .oldDepartureDateTime(scheduleEvent.getOldDepartureDateTime())
                .newDepartureDateTime(scheduleEvent.getNewDepartureDateTime())
                .oldArrivalDateTime(scheduleEvent.getOldArrivalDateTime())
                .newArrivalDateTime(scheduleEvent.getNewArrivalDateTime())
                .oldGate(scheduleEvent.getOldGate())
                .newGate(scheduleEvent.getNewGate())
                .oldTerminal(scheduleEvent.getOldTerminal())
                .newTerminal(scheduleEvent.getNewTerminal())
                .changedAt(scheduleEvent.getChangedAt())
                .manageBookingUrl(frontendBaseUrl + "/bookings")
                .build();

        kafkaTemplate.send(flightScheduleChangedNotificationTopic, booking.getBookingReference(), event);
        log.info("Published FlightScheduleChangedNotificationEvent for booking={}", booking.getBookingReference());
    }

    private void sendTicketIssued(BookingConfirmedEvent confirmedEvent) {
        if (confirmedEvent.getContactEmail() == null || confirmedEvent.getContactEmail().isBlank()) {
            return;
        }

        TicketIssuedEvent event = TicketIssuedEvent.builder()
                .eventId("ticket-issued-" + confirmedEvent.getBookingReference())
                .bookingId(confirmedEvent.getBookingId())
                .bookingReference(confirmedEvent.getBookingReference())
                .userId(confirmedEvent.getUserId())
                .userName(confirmedEvent.getUserName())
                .contactEmail(confirmedEvent.getContactEmail())
                .contactPhone(confirmedEvent.getContactPhone())
                .tripType(confirmedEvent.getTripType())
                .cabinClass(confirmedEvent.getCabinClass())
                .legs(confirmedEvent.getLegs())
                .passengers(confirmedEvent.getPassengers())
                .issuedAt(LocalDateTime.now())
                .viewTicketUrl(frontendBaseUrl + "/view-ticket/" + confirmedEvent.getBookingId())
                .manageBookingUrl(frontendBaseUrl + "/bookings")
                .build();

        kafkaTemplate.send(ticketIssuedTopic, confirmedEvent.getBookingReference(), event);
        log.info("Published TicketIssuedEvent for booking={}", confirmedEvent.getBookingReference());
    }

    private Contact contact(Booking booking) {
        String contactEmail = booking.getContactInfo() != null
                ? booking.getContactInfo().getEmail() : null;
        String contactPhone = booking.getContactInfo() != null
                ? booking.getContactInfo().getPhone() : null;

        if (contactEmail == null || contactEmail.isBlank()) {
            contactEmail = booking.getPassengers().stream()
                    .map(Passenger::getEmail)
                    .filter(e -> e != null && !e.isBlank())
                    .findFirst().orElse(null);
        }
        if (contactPhone == null || contactPhone.isBlank()) {
            contactPhone = booking.getPassengers().stream()
                    .map(Passenger::getPhone)
                    .filter(p -> p != null && !p.isBlank())
                    .findFirst().orElse(null);
        }

        return new Contact(contactEmail, contactPhone);
    }

    private record Contact(String email, String phone) {}

    private List<BookingLegNotificationData> buildLegs(
            Booking booking,
            Map<Long, FlightInstanceResponse> legFlightInstances,
            FlightInstanceResponse primaryFlight,
            String fareName) {
        if (booking.getLegs() == null || booking.getLegs().isEmpty()) {
            return primaryFlight == null
                    ? Collections.emptyList()
                    : List.of(toLegData(0, "Flight", booking.getCabinClass() != null ? booking.getCabinClass().name() : null,
                            fareName, primaryFlight));
        }

        Map<Long, FlightInstanceResponse> flightInstances = legFlightInstances != null
                ? legFlightInstances
                : Collections.emptyMap();
        List<BookingLeg> sortedLegs = booking.getLegs().stream()
                .sorted(Comparator.comparing(leg -> leg.getLegOrder() == null ? Integer.MAX_VALUE : leg.getLegOrder()))
                .toList();

        return sortedLegs.stream()
                .map(leg -> toLegData(
                        leg.getLegOrder(),
                        legLabel(booking.getTripType() != null ? booking.getTripType().name() : null, leg.getLegOrder()),
                        leg.getCabinClass() != null ? leg.getCabinClass().name() : null,
                        fareName,
                        flightInstances.getOrDefault(leg.getFlightInstanceId(), primaryFlight)))
                .collect(Collectors.toList());
    }

    private BookingLegNotificationData toLegData(
            Integer legOrder,
            String label,
            String cabinClass,
            String fareName,
            FlightInstanceResponse flight) {
        AirportResponse dep = flight != null ? flight.getDepartureAirport() : null;
        AirportResponse arr = flight != null ? flight.getArrivalAirport() : null;
        CityResponse depCity = dep != null ? dep.getCity() : null;
        CityResponse arrCity = arr != null ? arr.getCity() : null;

        return BookingLegNotificationData.builder()
                .legOrder(legOrder)
                .label(label)
                .flightNumber(flight != null ? flight.getFlightNumber() : "N/A")
                .airlineName(flight != null ? flight.getAirlineName() : "N/A")
                .aircraftModel(flight != null ? flight.getAircraftModal() : null)
                .cabinClass(cabinClass)
                .fareName(fareName)
                .departureAirportCode(dep != null ? dep.getIataCode() : "N/A")
                .departureAirportName(dep != null ? dep.getName() : "N/A")
                .departureCity(depCity != null ? depCity.getName() : "N/A")
                .departureCountry(depCity != null ? depCity.getCountryName() : null)
                .departureTerminal(flight != null ? flight.getTerminal() : null)
                .departureGate(flight != null ? flight.getGate() : null)
                .departureDate(formatDate(flight != null ? flight.getDepartureDateTime() : null))
                .departureTime(formatTime(flight != null ? flight.getDepartureDateTime() : null))
                .arrivalAirportCode(arr != null ? arr.getIataCode() : "N/A")
                .arrivalAirportName(arr != null ? arr.getName() : "N/A")
                .arrivalCity(arrCity != null ? arrCity.getName() : "N/A")
                .arrivalCountry(arrCity != null ? arrCity.getCountryName() : null)
                .arrivalDate(formatDate(flight != null ? flight.getArrivalDateTime() : null))
                .arrivalTime(formatTime(flight != null ? flight.getArrivalDateTime() : null))
                .duration(flight != null ? flight.getFormattedDuration() : null)
                .build();
    }

    private String legLabel(String tripType, Integer legOrder) {
        if ("ROUND_TRIP".equals(tripType)) {
            return legOrder != null && legOrder == 1 ? "Return" : "Departure";
        }
        if ("MULTI_CITY".equals(tripType)) {
            return "Leg " + ((legOrder != null ? legOrder : 0) + 1);
        }
        return "Flight";
    }

    private String formatDate(LocalDateTime value) {
        return value != null ? value.format(DATE_FMT) : "N/A";
    }

    private String formatTime(LocalDateTime value) {
        return value != null ? value.format(TIME_FMT) : "N/A";
    }
}
