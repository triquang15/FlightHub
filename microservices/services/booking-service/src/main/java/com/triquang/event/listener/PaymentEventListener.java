package com.triquang.event.listener;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.client.FlightClient;
import com.triquang.client.PricingClient;
import com.triquang.client.SeatClient;
import com.triquang.client.UserClient;
import com.triquang.dto.UserDTO;
import com.triquang.enums.BookingStatus;
import com.triquang.enums.TicketStatus;
import com.triquang.event.producer.BookingEventProducer;
import com.triquang.message.PaymentCompletedEvent;
import com.triquang.message.PaymentFailedEvent;
import com.triquang.message.PaymentRefundedEvent;
import com.triquang.model.Booking;
import com.triquang.payload.request.SeatConfirmRequest;
import com.triquang.payload.request.SeatReleaseRequest;
import com.triquang.payload.response.FareResponse;
import com.triquang.payload.response.FlightInstanceResponse;
import com.triquang.repository.BookingRepository;
import com.triquang.service.TicketService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentEventListener {

	private final BookingRepository bookingRepository;
	private final BookingEventProducer bookingEventProducer;
	private final FlightClient flightClient;
	private final PricingClient pricingClient;
	private final UserClient userClient;
	private final SeatClient seatClient;
	private final TicketService ticketService;

	@KafkaListener(
			topics = "${kafka.topics.payment-completed:payment.completed}",
			groupId = "${spring.kafka.consumer.group-id:booking-service-group}"
	)
	@Transactional
	public void handlePaymentCompleted(PaymentCompletedEvent event) {
		log.info("Received PaymentCompletedEvent for bookingId={}", event.getBookingId());

		Booking booking = bookingRepository.findByIdWithDetails(event.getBookingId()).orElse(null);
		if (booking == null) {
			log.error("Booking not found for id={}", event.getBookingId());
			return;
		}

		if (booking.getStatus() == BookingStatus.CONFIRMED) {
			log.info("Booking {} already confirmed; skipping duplicate payment event", booking.getBookingReference());
			return;
		}
		if (booking.getStatus() == BookingStatus.CANCELLED) {
			log.error("Payment {} completed for cancelled booking {}; manual refund required",
					event.getPaymentId(), booking.getBookingReference());
			return;
		}

		confirmSeats(booking);

		if (!booking.isTicketIssued()) {
			ticketService.generateTicketsForBooking(booking);
			booking.setTicketIssued(true);
		}

		booking.setStatus(BookingStatus.CONFIRMED);
		booking.setPaymentId(event.getPaymentId());
		booking = bookingRepository.save(booking);
		log.info("Booking {} confirmed after payment {}", booking.getBookingReference(), event.getPaymentId());

		// Fetch enrichment data for notification — failures are non-fatal
		FlightInstanceResponse flightInstance = fetchFlightInstance(booking.getFlightInstanceId());
		Map<Long, FlightInstanceResponse> legFlightInstances = fetchLegFlightInstances(booking);
		FareResponse fareResponse = fetchFare(booking.getFareId());
		UserDTO userDTO = fetchUser(booking.getUserId());

		// Publish enriched event (seat-service + notification-service both consume it)
		bookingEventProducer.sendBookingConfirmed(booking, event, flightInstance, legFlightInstances, fareResponse, userDTO);
	}

	@KafkaListener(
			topics = "${kafka.topics.payment-failed:payment.failed}",
			groupId = "${spring.kafka.consumer.group-id:booking-service-group}"
	)
	@Transactional
	public void handlePaymentFailed(PaymentFailedEvent event) {
		log.info("Received PaymentFailedEvent for bookingId={}", event.getBookingId());

		Booking booking = bookingRepository.findById(event.getBookingId()).orElse(null);
		if (booking == null) {
			log.error("Booking not found for id={}", event.getBookingId());
			return;
		}

		if (booking.getStatus() == BookingStatus.CONFIRMED) {
			log.warn("Ignoring failed payment event for already confirmed booking {}", booking.getBookingReference());
			return;
		}

		releaseSeats(booking);

		booking.setStatus(BookingStatus.CANCELLED);
		bookingRepository.save(booking);
		log.warn("Booking {} cancelled due to payment failure: {}", booking.getBookingReference(),
				event.getFailureReason());
	}

	@KafkaListener(
			topics = "${kafka.topics.payment-refunded:payment.refunded}",
			groupId = "${spring.kafka.consumer.group-id:booking-service-group}"
	)
	@Transactional
	public void handlePaymentRefunded(PaymentRefundedEvent event) {
		Booking booking = bookingRepository.findById(event.getBookingId()).orElse(null);
		if (booking == null || booking.getStatus() == BookingStatus.CANCELLED) {
			return;
		}

		if (booking.getTickets() != null) {
			booking.getTickets().forEach(ticket -> ticket.setStatus(TicketStatus.REFUNDED));
		}
		releaseSeats(booking);
		booking.setStatus(BookingStatus.CANCELLED);
		bookingRepository.save(booking);
		log.info("Booking {} cancelled after refund {}", booking.getBookingReference(), event.getRefundId());
	}

	// ── Private Helpers ───────────────────────────────────────────────────────

	private FlightInstanceResponse fetchFlightInstance(Long flightInstanceId) {
		if (flightInstanceId == null)
			return null;
		try {
			return flightClient.getFlightInstanceResponse(flightInstanceId);
		} catch (Exception e) {
			log.warn("Could not fetch FlightInstance id={} for notification enrichment: {}", flightInstanceId,
					e.getMessage());
			return null;
		}
	}

	private Map<Long, FlightInstanceResponse> fetchLegFlightInstances(Booking booking) {
		if (booking == null || booking.getLegs() == null || booking.getLegs().isEmpty()) {
			return Collections.emptyMap();
		}

		List<Long> flightInstanceIds = booking.getLegs().stream()
				.map(leg -> leg.getFlightInstanceId())
				.distinct()
				.toList();
		if (flightInstanceIds.isEmpty()) {
			return Collections.emptyMap();
		}

		try {
			return flightClient.getFlightInstancesByIds(flightInstanceIds);
		} catch (Exception e) {
			log.warn("Could not fetch leg FlightInstances ids={} for notification enrichment: {}",
					flightInstanceIds, e.getMessage());
			return Collections.emptyMap();
		}
	}

	private FareResponse fetchFare(Long fareId) {
		if (fareId == null)
			return null;
		try {
			return pricingClient.getFareById(fareId);
		} catch (Exception e) {
			log.warn("Could not fetch Fare id={} for notification enrichment: {}", fareId, e.getMessage());
			return null;
		}
	}

	private UserDTO fetchUser(Long userId) {
		if (userId == null)
			return null;
		try {
			return userClient.getUserById(userId);
		} catch (Exception e) {
			log.warn("Could not fetch User id={} for notification enrichment: {}", userId, e.getMessage());
			return null;
		}
	}

	private void confirmSeats(Booking booking) {
		if (booking.getSeatInstanceIds() == null || booking.getSeatInstanceIds().isEmpty()) {
			return;
		}

		seatClient.confirmSeats(SeatConfirmRequest.builder()
				.seatInstanceIds(booking.getSeatInstanceIds())
				.holdToken(booking.getSeatHoldToken())
				.bookingReference(booking.getBookingReference())
				.build());
	}

	private void releaseSeats(Booking booking) {
		if (booking.getSeatInstanceIds() == null || booking.getSeatInstanceIds().isEmpty()) {
			return;
		}

		try {
			seatClient.releaseSeats(SeatReleaseRequest.builder()
					.seatInstanceIds(booking.getSeatInstanceIds())
					.holdToken(booking.getSeatHoldToken())
					.bookingReference(booking.getBookingReference())
					.build());
		} catch (Exception e) {
			log.warn("Could not release seats for failed booking {}: {}", booking.getBookingReference(), e.getMessage());
		}
	}
}
