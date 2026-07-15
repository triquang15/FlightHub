package com.triquang.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.triquang.message.FlightInstanceCreatedEvent;

@Service
@RequiredArgsConstructor
@Slf4j
public class FlightInstanceEventProducer {

	private final KafkaTemplate<String, FlightInstanceCreatedEvent> kafkaTemplate;

	@Value("${kafka.topics.flight-instance-created:flight-instance-created}")
	private String flightInstanceCreatedTopic;

	public void sendFlightInstanceCreated(FlightInstanceCreatedEvent event) {

		try {
			kafkaTemplate.send(flightInstanceCreatedTopic, String.valueOf(event.getFlightInstanceId()), event);

			log.info("Kafka event sent | topic={} | flightInstanceId={} | flightId={}",
					flightInstanceCreatedTopic, event.getFlightInstanceId(), event.getFlightId());

		} catch (Exception e) {

			log.error("Kafka send failed | topic={} | flightInstanceId={}",
					flightInstanceCreatedTopic, event.getFlightInstanceId(), e);

			throw e;
		}
	}
}
