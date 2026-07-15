package com.triquang.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.client.AirlineClient;
import com.triquang.enums.ErrorCode;
import com.triquang.enums.FlightStatus;
import com.triquang.event.FlightInstanceEventProducer;
import com.triquang.exception.BaseException;
import com.triquang.mapper.FlightInstanceMapper;
import com.triquang.message.FlightInstanceCreatedEvent;
import com.triquang.message.FlightScheduleChangedEvent;
import com.triquang.model.Flight;
import com.triquang.model.FlightInstance;
import com.triquang.payload.request.FlightInstanceRequest;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.AirportResponse;
import com.triquang.payload.response.FlightInstanceInventorySummary;
import com.triquang.payload.response.FlightInstanceResponse;
import com.triquang.repository.FlightInstanceRepository;
import com.triquang.repository.FlightRepository;
import com.triquang.service.FlightInstanceService;
import com.triquang.service.FlightStatusTransitionPolicy;
import com.triquang.service.ReferenceDataService;

import feign.FeignException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
@Slf4j
public class FlightInstanceServiceImpl implements FlightInstanceService {

	private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
			"id",
			"departureDateTime",
			"arrivalDateTime",
			"totalSeats",
			"availableSeats",
			"status",
			"departureAirportId",
			"arrivalAirportId");

	private final FlightInstanceRepository flightInstanceRepository;
	private final FlightRepository flightRepository;
	private final AirlineClient airlineClient;
	private final FlightInstanceEventProducer flightInstanceEventProducer;
	private final FlightStatusTransitionPolicy statusTransitionPolicy;
	private final ReferenceDataService referenceDataService;

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
		instance.setDepartureAirportId(flight.getDepartureAirportId());
		instance.setArrivalAirportId(flight.getArrivalAirportId());
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
	@Transactional(readOnly = true)
	public Page<FlightInstanceResponse> getFlightInstances(Pageable pageable) {
		Pageable safePageable = safePageable(pageable);
		Page<FlightInstance> page = flightInstanceRepository.findAll(safePageable);
		return new PageImpl<>(enrichInstances(page.getContent()), safePageable, page.getTotalElements());
	}

	@Override
	@Transactional(readOnly = true)
	public FlightInstanceInventorySummary getInventorySummary() {
		return new FlightInstanceInventorySummary(
				flightInstanceRepository.count(),
				flightInstanceRepository.countByStatusIn(List.of(FlightStatus.BOARDING, FlightStatus.DEPARTED)),
				flightInstanceRepository.countByStatusIn(List.of(FlightStatus.CANCELLED)));
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
		Pageable safePageable = safePageable(pageable);

		Page<FlightInstance> page = flightInstanceRepository.findAll(
				buildAirlineInstanceSpecification(airlineId, departureAirportId, arrivalAirportId, flightId, start, end),
				safePageable);
		return new PageImpl<>(enrichInstances(page.getContent()), safePageable, page.getTotalElements());
	}

	@Override
	@CacheEvict(cacheNames = "flightInstances", key = "#id")
	public FlightInstanceResponse updateFlightInstance(Long userId, Long id, FlightInstanceRequest request) throws BaseException {
		FlightInstance existing = flightInstanceRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_INSTANCE_NOT_FOUND));
		requireOwnership(existing.getFlight(), getAirlineForUser(userId));
		validateInstance(request, existing.getFlight());
		FlightScheduleChangedEvent before = scheduleSnapshot(existing);

		FlightInstanceMapper.updateEntity(request, existing);
		FlightInstance saved = flightInstanceRepository.save(existing);
		flightInstanceEventProducer.sendFlightScheduleChanged(scheduleChangedEvent(saved, before));
		return getFlightInstance(saved);
	}

	@Override
	@CacheEvict(cacheNames = "flightInstances", key = "#id")
	public FlightInstanceResponse changeStatus(Long userId, Long id, FlightStatus status) {
		var instance = flightInstanceRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_INSTANCE_NOT_FOUND));
		requireOwnership(instance.getFlight(), getAirlineForUser(userId));
		statusTransitionPolicy.validate(instance.getStatus(), status);
		FlightScheduleChangedEvent before = scheduleSnapshot(instance);
		instance.setStatus(status);
		if (status == FlightStatus.CANCELLED || status == FlightStatus.ARRIVED) {
			instance.setIsActive(false);
		}
		FlightInstance saved = flightInstanceRepository.save(instance);
		flightInstanceEventProducer.sendFlightScheduleChanged(scheduleChangedEvent(saved, before));
		return getFlightInstance(saved);
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
			var airline = airlineCache.computeIfAbsent(fi.getAirlineId(), referenceDataService::getAirline);
			var aircraft = aircraftCache.computeIfAbsent(fi.getFlight().getAircraftId(),
					referenceDataService::getAircraft);
			var departure = airportCache.computeIfAbsent(fi.getDepartureAirportId(), referenceDataService::getAirport);
			var arrival = airportCache.computeIfAbsent(fi.getArrivalAirportId(), referenceDataService::getAirport);
			result.put(fi.getId(), FlightInstanceMapper.toResponse(fi, aircraft, airline, departure, arrival));
		}
		return result;
	}

	// ── Private helpers ───────────────────────────────────────────────────────

	private AircraftResponse getAircraftById(Long aircraftId) {
	    try {
	        AircraftResponse aircraft = airlineClient.getAircraftById(aircraftId);
	        if (aircraft == null) {
	            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
	        }
	        return aircraft;
	    } catch (FeignException.NotFound e) {
	        throw new BaseException(ErrorCode.AIRCRAFT_NOT_FOUND);
	    } catch (FeignException e) {
	        throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
	    }
	}

	private Long getAirlineForUser(Long userId) {
	    try {
	        AirlineResponse airline = airlineClient.getAirlineByOwner(userId);
	        if (airline == null) {
	            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
	        }
	        return airline.getId();
	    } catch (FeignException.NotFound e) {
	        throw new BaseException(ErrorCode.AIRLINE_NOT_FOUND);
	    } catch (FeignException e) {
	        throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
	    }
	}

	private FlightInstanceResponse getFlightInstance(FlightInstance fi) {
	    var airline = referenceDataService.getAirline(fi.getAirlineId());
	    var departureAirport = referenceDataService.getAirport(fi.getDepartureAirportId());
	    var arrivalAirport = referenceDataService.getAirport(fi.getArrivalAirportId());
	    var aircraftResponse = referenceDataService.getAircraft(fi.getFlight().getAircraftId());

	    if (airline == null || departureAirport == null || arrivalAirport == null || aircraftResponse == null) {
	        log.warn(
	                "Returning partially enriched flight instance | instanceId={} flightId={} airlineResolved={} aircraftResolved={} departureResolved={} arrivalResolved={}",
	                fi.getId(),
	                fi.getFlight().getId(),
	                airline != null,
	                aircraftResponse != null,
	                departureAirport != null,
	                arrivalAirport != null
	        );
	    }

	    return FlightInstanceMapper.toResponse(
	            fi,
	            aircraftResponse,
	            airline,
	            departureAirport,
	            arrivalAirport
	    );
	}

	private List<FlightInstanceResponse> enrichInstances(List<FlightInstance> instances) {
		Map<Long, AirlineResponse> airlineCache = new HashMap<>();
		Map<Long, AircraftResponse> aircraftCache = new HashMap<>();
		Map<Long, AirportResponse> airportCache = new HashMap<>();

		return instances.stream().map(fi -> {
			var airline = airlineCache.computeIfAbsent(fi.getAirlineId(), referenceDataService::getAirline);
			var aircraft = aircraftCache.computeIfAbsent(
					fi.getFlight().getAircraftId(), referenceDataService::getAircraft);
			var departure = airportCache.computeIfAbsent(
					fi.getDepartureAirportId(), referenceDataService::getAirport);
			var arrival = airportCache.computeIfAbsent(
					fi.getArrivalAirportId(), referenceDataService::getAirport);
			return FlightInstanceMapper.toResponse(fi, aircraft, airline, departure, arrival);
		}).toList();
	}

	private FlightScheduleChangedEvent scheduleSnapshot(FlightInstance instance) {
		return FlightScheduleChangedEvent.builder()
				.flightInstanceId(instance.getId())
				.flightId(instance.getFlight() != null ? instance.getFlight().getId() : null)
				.airlineId(instance.getAirlineId())
				.flightNumber(instance.getFlight() != null ? instance.getFlight().getFlightNumber() : null)
				.oldStatus(instance.getStatus() != null ? instance.getStatus().name() : null)
				.oldDepartureDateTime(instance.getDepartureDateTime())
				.oldArrivalDateTime(instance.getArrivalDateTime())
				.oldGate(instance.getGate())
				.oldTerminal(instance.getTerminal())
				.build();
	}

	private FlightScheduleChangedEvent scheduleChangedEvent(FlightInstance instance, FlightScheduleChangedEvent before) {
		return FlightScheduleChangedEvent.builder()
				.eventId(UUID.randomUUID().toString())
				.flightInstanceId(instance.getId())
				.flightId(instance.getFlight() != null ? instance.getFlight().getId() : null)
				.airlineId(instance.getAirlineId())
				.flightNumber(instance.getFlight() != null ? instance.getFlight().getFlightNumber() : null)
				.oldStatus(before.getOldStatus())
				.newStatus(instance.getStatus() != null ? instance.getStatus().name() : null)
				.oldDepartureDateTime(before.getOldDepartureDateTime())
				.newDepartureDateTime(instance.getDepartureDateTime())
				.oldArrivalDateTime(before.getOldArrivalDateTime())
				.newArrivalDateTime(instance.getArrivalDateTime())
				.oldGate(before.getOldGate())
				.newGate(instance.getGate())
				.oldTerminal(before.getOldTerminal())
				.newTerminal(instance.getTerminal())
				.changedAt(LocalDateTime.now())
				.build();
	}

	private void requireOwnership(Flight flight, Long airlineId) {
		if (!flight.getAirlineId().equals(airlineId)) {
			throw new BaseException(ErrorCode.FLIGHT_RESOURCE_NOT_OWNED);
		}
	}

	private Pageable safePageable(Pageable pageable) {
		List<Sort.Order> safeOrders = pageable.getSort().stream()
				.filter(order -> ALLOWED_SORT_FIELDS.contains(order.getProperty()))
				.map(order -> new Sort.Order(order.getDirection(), order.getProperty()))
				.toList();

		Sort safeSort = safeOrders.isEmpty()
				? Sort.by(Sort.Direction.ASC, "departureDateTime")
				: Sort.by(safeOrders);

		return PageRequest.of(
				Math.max(pageable.getPageNumber(), 0),
				Math.clamp(pageable.getPageSize(), 1, 100),
				safeSort);
	}

	private Specification<FlightInstance> buildAirlineInstanceSpecification(Long airlineId, Long departureAirportId,
			Long arrivalAirportId, Long flightId, LocalDateTime start, LocalDateTime end) {
		return (root, query, criteriaBuilder) -> {
			List<Predicate> predicates = new ArrayList<>();
			predicates.add(criteriaBuilder.equal(root.get("airlineId"), airlineId));

			if (departureAirportId != null) {
				predicates.add(criteriaBuilder.equal(root.get("departureAirportId"), departureAirportId));
			}
			if (arrivalAirportId != null) {
				predicates.add(criteriaBuilder.equal(root.get("arrivalAirportId"), arrivalAirportId));
			}
			if (flightId != null) {
				predicates.add(criteriaBuilder.equal(root.get("flight").get("id"), flightId));
			}
			if (start != null) {
				predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("departureDateTime"), start));
			}
			if (end != null) {
				predicates.add(criteriaBuilder.lessThan(root.get("departureDateTime"), end));
			}

			return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
		};
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
