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
import com.triquang.enums.FlightStatus;
import com.triquang.event.FlightInstanceEventProducer;
import com.triquang.exception.BaseException;
import com.triquang.mapper.FlightInstanceMapper;
import com.triquang.message.FlightInstanceCreatedEvent;
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
import com.triquang.service.FlightStatusTransitionPolicy;

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
	private final FlightStatusTransitionPolicy statusTransitionPolicy;

	@Override
	@Transactional
	@CacheEvict(cacheNames = "flightInstances", allEntries = true)
	public FlightInstanceResponse createFlightInstanceWithCabins(Long userId, FlightInstanceRequest request) {

		Long airlineId = getAirlineForUser(userId);

		Flight flight = flightRepository.findByIdForUpdate(request.getFlightId())
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_NOT_FOUND));
		requireOwnership(flight, airlineId);
		validateInstance(request, flight);

		var existing = flightInstanceRepository.findByFlightIdAndDepartureDateTime(
				flight.getId(), request.getDepartureDateTime());
		if (existing.isPresent()) {
			return getFlightInstance(existing.get());
		}

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

		return getFlightInstance(instance);
	}

	@Override
	public List<FlightInstanceResponse> getFlightInstances() {
		return flightInstanceRepository.findAll().stream().map(fi -> {
			try {
				return getFlightInstance(fi);
			} catch (BaseException e) {
				throw new RuntimeException(e);
			}
		}).toList();
	}

	@Override
	@Transactional(readOnly = true)
	@Cacheable(cacheNames = "flightInstances", key = "#id")
	public FlightInstanceResponse getFlightInstanceById(Long id) throws BaseException {
		FlightInstance fi = flightInstanceRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_INSTANCE_NOT_FOUND));

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
					} catch (BaseException e) {
						throw new RuntimeException(e);
					}
				});
	}

	@Override
	@CacheEvict(cacheNames = "flightInstances", key = "#id")
	public FlightInstanceResponse updateFlightInstance(Long userId, Long id, FlightInstanceRequest request) throws BaseException {
		FlightInstance existing = flightInstanceRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_INSTANCE_NOT_FOUND));
		requireOwnership(existing.getFlight(), getAirlineForUser(userId));
		validateInstance(request, existing.getFlight());

		FlightInstanceMapper.updateEntity(request, existing);
		return getFlightInstance(flightInstanceRepository.save(existing));
	}

	@Override
	@CacheEvict(cacheNames = "flightInstances", key = "#id")
	public FlightInstanceResponse changeStatus(Long userId, Long id, FlightStatus status) {
		var instance = flightInstanceRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_INSTANCE_NOT_FOUND));
		requireOwnership(instance.getFlight(), getAirlineForUser(userId));
		statusTransitionPolicy.validate(instance.getStatus(), status);
		instance.setStatus(status);
		if (status == FlightStatus.CANCELLED || status == FlightStatus.ARRIVED) {
			instance.setIsActive(false);
		}
		return getFlightInstance(flightInstanceRepository.save(instance));
	}

	@Override
	@CacheEvict(cacheNames = "flightInstances", key = "#id")
	public void deleteFlightInstance(Long userId, Long id) {
		var fi = flightInstanceRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_INSTANCE_NOT_FOUND));
		requireOwnership(fi.getFlight(), getAirlineForUser(userId));
		if (fi.getStatus() != FlightStatus.SCHEDULED) {
			throw new BaseException(ErrorCode.INVALID_FLIGHT_STATUS_TRANSITION);
		}
		if (!fi.getAvailableSeats().equals(fi.getTotalSeats())) {
			throw new BaseException(ErrorCode.FLIGHT_INSTANCE_HAS_BOOKINGS);
		}
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
	        throw new BaseException(ErrorCode.AIRCRAFT_NOT_FOUND);
	    } catch (FeignException e) {
	        throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
	    }
	}

	private Long getAirlineForUser(Long userId) {
	    try {
	        AirlineResponse airline = airlineClient.getAirlineByOwner(userId);
	        return airline.getId();
	    } catch (FeignException.NotFound e) {
	        throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);
	    } catch (FeignException e) {
	        throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
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

	private void requireOwnership(Flight flight, Long airlineId) {
		if (!flight.getAirlineId().equals(airlineId)) {
			throw new BaseException(ErrorCode.FLIGHT_RESOURCE_NOT_OWNED);
		}
	}

	private void validateInstance(FlightInstanceRequest request, Flight flight) {
		Long departureId = request.getDepartureAirportId() != null
				? request.getDepartureAirportId() : flight.getDepartureAirportId();
		Long arrivalId = request.getArrivalAirportId() != null
				? request.getArrivalAirportId() : flight.getArrivalAirportId();
		if (!departureId.equals(flight.getDepartureAirportId())
				|| !arrivalId.equals(flight.getArrivalAirportId())
				|| departureId.equals(arrivalId)
				|| !request.getArrivalDateTime().isAfter(request.getDepartureDateTime())) {
			throw new BaseException(ErrorCode.INVALID_INPUT);
		}
	}
}
