package com.triquang.event.listener;

import java.util.Collections;
import java.util.Map;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.dto.UserDTO;
import com.triquang.enums.BookingStatus;
import com.triquang.event.producer.BookingEventProducer;
import com.triquang.message.FlightScheduleChangedEvent;
import com.triquang.payload.response.FlightInstanceResponse;
import com.triquang.repository.BookingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlightScheduleEventListener {

    private final BookingRepository bookingRepository;
    private final BookingEventProducer bookingEventProducer;
    private final PaymentEventListener paymentEventListener;

    @KafkaListener(
            topics = "${kafka.topics.flight-schedule-changed:flight.schedule-changed}",
            groupId = "${spring.kafka.consumer.group-id:booking-service-group}"
    )
    @Transactional(readOnly = true)
    public void handleFlightScheduleChanged(FlightScheduleChangedEvent event) {
        if (event.getFlightInstanceId() == null) {
            log.warn("Ignoring schedule change event without flightInstanceId eventId={}", event.getEventId());
            return;
        }

        var bookings = bookingRepository.findAffectedBookingsForFlightInstance(
                event.getFlightInstanceId(), BookingStatus.CONFIRMED);
        if (bookings.isEmpty()) {
            log.info("No confirmed bookings affected by flight schedule change flightInstanceId={}",
                    event.getFlightInstanceId());
            return;
        }

        FlightInstanceResponse primaryFlight = paymentEventListener.fetchFlightInstanceForNotification(event.getFlightInstanceId());
        for (var booking : bookings) {
            Map<Long, FlightInstanceResponse> legFlights = paymentEventListener.fetchLegFlightInstancesForNotification(booking);
            UserDTO user = paymentEventListener.fetchUserForNotification(booking.getUserId());
            bookingEventProducer.sendFlightScheduleChanged(
                    booking,
                    event,
                    legFlights != null ? legFlights : Collections.emptyMap(),
                    primaryFlight,
                    user);
        }

        log.info("Published schedule change notifications for {} booking(s), flightInstanceId={}",
                bookings.size(), event.getFlightInstanceId());
    }
}
