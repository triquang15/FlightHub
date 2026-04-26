package com.triquang.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.client.AirlineClient;
import com.triquang.client.LocationClient;
import com.triquang.enums.ErrorCode;
import com.triquang.event.FlightInstanceCreatedEvent;
import com.triquang.event.FlightInstanceEventProducer;
import com.triquang.exception.AirportException;
import com.triquang.exception.FlightException;
import com.triquang.mapper.FlightInstanceMapper;
import com.triquang.model.Flight;
import com.triquang.model.FlightInstance;
import com.triquang.payload.request.FlightInstanceRequest;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.AirportResponse;
import com.triquang.payload.response.FlightInstanceResponse;
import com.triquang.repository.FlightInstanceRepository;
import com.triquang.repository.FlightRepository;
import com.triquang.service.FlightInstanceService;

import feign.FeignException;
import lombok.RequiredArgsConstructor;

/**
 * Service implementation for managing flight instances, including creation, retrieval, updating, and deletion.
 * This service interacts with the FlightRepository for database operations and uses Feign clients to communicate
 * with external services for airline and location data. It also publishes events to Kafka when a new flight instance is created.
 * 
 * @author Tri Quang
 */

@Service
@RequiredArgsConstructor
@Transactional
public class FlightInstanceServiceImpl implements FlightInstanceService {

	private final FlightInstanceRepository flightInstanceRepository;
	private final FlightRepository flightRepository;
	private final AirlineClient airlineClient;
	private final FlightInstanceEventProducer flightInstanceEventProducer;
	private final LocationClient locationClient;

	@Override
	@Transactional
	@CacheEvict(cacheNames = "flightInstances", allEntries = true)
	public FlightInstanceResponse createFlightInstanceWithCabins(Long userId, FlightInstanceRequest request) {

		Long airlineId = getAirlineForUser(userId);

		Flight flight = flightRepository.findById(request.getFlightId())
				.orElseThrow(() -> new FlightException(ErrorCode.FLIGHT_NOT_FOUND));

		AircraftResponse aircraft = getAircraftById(flight.getAircraftId());

		FlightInstance instance = FlightInstanceMapper.toEntity(request, flight);
		instance.setAirlineId(airlineId);
		instance.setFlight(flight);
		instance.setDepartureAirportId(request.getDepartureAirportId());
		instance.setArrivalAirportId(request.getArrivalAirportId());
		instance.setTotalSeats(aircraft.getTotalSeats());
		instance.setAvailableSeats(aircraft.getTotalSeats());

		FlightInstance flightInstance = flightInstanceRepository.save(instance);

		// Publish event for seat-service to create FlightInstanceCabins
		flightInstanceEventProducer
				.sendFlightInstanceCreated(FlightInstanceCreatedEvent.builder().flightInstanceId(flightInstance.getId())
						.aircraftId(flight.getAircraftId()).flightId(flight.getId()).build());

		System.out.println("Publish event for seat-service to create FlightInstanceCabins ----- ");

		return getFlightInstance(instance);
	}

	@Override
	public List<FlightInstanceResponse> getFlightInstances() {
		return flightInstanceRepository.findAll().stream().map(fi -> {
			try {
				return getFlightInstance(fi);
			} catch (AirportException e) {
				throw new RuntimeException(e);
			}
		}).toList();
	}

	@Override
	@Transactional(readOnly = true)
	@Cacheable(cacheNames = "flightInstances", key = "#id")
	public FlightInstanceResponse getFlightInstanceById(Long id) throws AirportException {
		FlightInstance fi = flightInstanceRepository.findById(id)
				.orElseThrow(() -> new FlightException(ErrorCode.FLIGHT_INSTANCE_NOT_FOUND));

		return getFlightInstance(fi);
	}

	@Override
	@Transactional(readOnly = true)
	public Page<FlightInstanceResponse> getByAirlineId(Long userId, Long departureAirportId, Long arrivalAirportId,
			Long flightId, LocalDate onDate, Pageable pageable) {
		Long airlineId = getAirlineForUser(userId);
		LocalDateTime start = onDate != null ? onDate.atStartOfDay() : null;
		LocalDateTime end = onDate != null ? onDate.plusDays(1).atStartOfDay() : null;

		return flightInstanceRepository.findByAirlineIdWithFilters(airlineId, departureAirportId, arrivalAirportId,
				flightId, start, end, pageable).map(fi -> {
					try {
						return getFlightInstance(fi);
					} catch (AirportException e) {
						throw new RuntimeException(e);
					}
				});
	}

	@Override
	@CacheEvict(cacheNames = "flightInstances", key = "#id")
	public FlightInstanceResponse updateFlightInstance(Long id, FlightInstanceRequest request) throws AirportException {
		FlightInstance existing = flightInstanceRepository.findById(id)
				.orElseThrow(() -> new FlightException(ErrorCode.FLIGHT_INSTANCE_NOT_FOUND));

		FlightInstanceMapper.updateEntity(request, existing);
		return getFlightInstance(flightInstanceRepository.save(existing));
	}

	@Override
	@CacheEvict(cacheNames = "flightInstances", key = "#id")
	public void deleteFlightInstance(Long id) {
		var fi = flightInstanceRepository.findById(id)
				.orElseThrow(() -> new FlightException(ErrorCode.FLIGHT_INSTANCE_NOT_FOUND));
		flightInstanceRepository.delete(fi);
	}

	@Override
	@Transactional(readOnly = true)
	public Map<Long, FlightInstanceResponse> getFlightInstancesByIds(List<Long> ids) {
		if (ids == null || ids.isEmpty())
			return Map.of();
		List<FlightInstance> instances = flightInstanceRepository.findAllByIdInWithFlight(ids);

		Map<Long, AirlineResponse> airlineCache = new HashMap<>();
		Map<Long, AircraftResponse> aircraftCache = new HashMap<>();
		Map<Long, AirportResponse> airportCache = new HashMap<>();

		Map<Long, FlightInstanceResponse> result = new HashMap<>();
		for (FlightInstance fi : instances) {
			var airline = airlineCache.computeIfAbsent(fi.getAirlineId(), airlineClient::getAirlineById);
			var aircraft = aircraftCache.computeIfAbsent(fi.getFlight().getAircraftId(),
					airlineClient::getAircraftById);
			var departure = airportCache.computeIfAbsent(fi.getDepartureAirportId(), locationClient::getAirportById);
			var arrival = airportCache.computeIfAbsent(fi.getArrivalAirportId(), locationClient::getAirportById);
			result.put(fi.getId(), FlightInstanceMapper.toResponse(fi, aircraft, airline, departure, arrival));
		}
		return result;
	}

	// ── Private helpers ───────────────────────────────────────────────────────

	private AircraftResponse getAircraftById(Long aircraftId) {
	    try {
	        return airlineClient.getAircraftById(aircraftId);
	    } catch (FeignException.NotFound e) {
	        throw new FlightException(ErrorCode.AIRCRAFT_NOT_FOUND);
	    } catch (FeignException e) {
	        throw new FlightException(ErrorCode.EXTERNAL_SERVICE_ERROR);
	    }
	}

	private Long getAirlineForUser(Long userId) {
	    try {
	        AirlineResponse airline = airlineClient.getAirlineByOwner(userId);
	        return airline.getId();
	    } catch (FeignException.NotFound e) {
	        throw new FlightException(ErrorCode.AIRLINE_NOT_FOUND);
	    } catch (FeignException e) {
	        throw new FlightException(ErrorCode.EXTERNAL_SERVICE_ERROR);
	    }
	}

	private FlightInstanceResponse getFlightInstance(FlightInstance fi) {
	    var airline = airlineClient.getAirlineById(fi.getAirlineId());
	    var departureAirport = locationClient.getAirportById(fi.getDepartureAirportId());
	    var arrivalAirport = locationClient.getAirportById(fi.getArrivalAirportId());
	    var aircraftResponse = airlineClient.getAircraftById(fi.getFlight().getAircraftId());

	    return FlightInstanceMapper.toResponse(
	            fi,
	            aircraftResponse,
	            airline,
	            departureAirport,
	            arrivalAirport
	    );
	}
}
