package com.triquang.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.triquang.message.FlightInstanceCreatedEvent;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlightInstanceEventProducer {

	private final KafkaTemplate<String, FlightInstanceCreatedEvent> kafkaTemplate;

	public void sendFlightInstanceCreated(FlightInstanceCreatedEvent event) {

		try {
			kafkaTemplate.send("flight-instance-created", event);

			log.info("Kafka event sent | topic=flight-instance-created | flightInstanceId={} | flightId={}",
					event.getFlightInstanceId(), event.getFlightId());

		} catch (Exception e) {

			log.error("Kafka send failed | topic=flight-instance-created | flightInstanceId={}",
					event.getFlightInstanceId(), e);

			throw e;
		}
	}
}