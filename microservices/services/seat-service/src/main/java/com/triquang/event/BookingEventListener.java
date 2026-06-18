package com.triquang.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.message.BookingConfirmedEvent;
import com.triquang.payload.request.SeatConfirmRequest;
import com.triquang.service.SeatInstanceService;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingEventListener {

	private final SeatInstanceService seatInstanceService;

	@KafkaListener(
			topics = "${kafka.topics.booking-confirmed:booking.confirmed}",
			groupId = "${spring.kafka.consumer.group-id:seat-service-group}"
	)
	@Transactional
	public void handleBookingConfirmed(BookingConfirmedEvent event) {
		if (event.getSeatInstanceIds() == null || event.getSeatInstanceIds().isEmpty()) {
			log.warn("No seat instance IDs in BookingConfirmedEvent for booking: {}", event.getBookingReference());
			return;
		}

		try {
			seatInstanceService.confirmSeats(SeatConfirmRequest.builder()
					.seatInstanceIds(event.getSeatInstanceIds())
					.bookingReference(event.getBookingReference())
					.build());
			log.info("Seat instances {} marked as BOOKED for booking {}",
					event.getSeatInstanceIds(), event.getBookingReference());
		} catch (Exception e) {
			log.error("Failed to confirm seat instances for booking {}: {}",
					event.getBookingReference(), e.getMessage());
		}
	}
}
