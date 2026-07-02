package com.triquang.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.client.AirlineClient;
import com.triquang.client.LocationClient;
import com.triquang.enums.ErrorCode;
import com.triquang.enums.FlightStatus;
import com.triquang.exception.BaseException;
import com.triquang.mapper.FlightMapper;
import com.triquang.model.Flight;
import com.triquang.payload.request.FlightRequest;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.AirportResponse;
import com.triquang.payload.response.FlightResponse;
import com.triquang.repository.FlightRepository;
import com.triquang.service.FlightService;
import com.triquang.service.ReferenceDataService;

import feign.FeignException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FlightServiceImpl implements FlightService {

	private final FlightRepository flightRepository;
	private final AirlineClient airlineClient;
	private final LocationClient locationClient;
	private final ReferenceDataService referenceDataService;

	// =========================
	// CREATE FLIGHT
	// =========================
	@Override
	public FlightResponse createFlight(Long userId, FlightRequest request) {
		normalizeAndValidateRoute(request);

		if (flightRepository.existsByFlightNumber(request.getFlightNumber())) {
			throw new BaseException(ErrorCode.FLIGHT_ALREADY_EXISTS);
		}

		Long airlineId = getAirlineForUser(userId);

		validateAircraftOwnership(request.getAircraftId(), airlineId);

		Flight flight = FlightMapper.toEntity(request);
		flight.setAirlineId(airlineId);

		Flight saved = flightRepository.save(flight);

		return getFlightResponse(saved);
	}

	// =========================
	// BULK CREATE
	// =========================
	@Override
	public List<FlightResponse> createFlights(Long userId, List<FlightRequest> requests) {

		Long airlineId = getAirlineForUser(userId);
		requests.forEach(this::normalizeAndValidateRoute);

		Set<String> existingNumbers = flightRepository.findExistingFlightNumbers(
				requests.stream().map(FlightRequest::getFlightNumber).toList()
		);

		Set<Long> validatedAircraftIds = new HashSet<>();
		Set<String> incomingNumbers = new HashSet<>();

		List<Flight> toSave = requests.stream()
				.filter(req -> !existingNumbers.contains(req.getFlightNumber()))
				.filter(req -> incomingNumbers.add(req.getFlightNumber()))
				.map(req -> {
					if (validatedAircraftIds.add(req.getAircraftId())) {
						validateAircraftOwnership(req.getAircraftId(), airlineId);
					}

					Flight flight = FlightMapper.toEntity(req);
					flight.setAirlineId(airlineId);
					return flight;
				})
				.toList();

		List<Flight> saved = flightRepository.saveAll(toSave);

		AirlineResponse airline = airlineClient.getAirlineById(airlineId);

		Map<Long, AircraftResponse> aircraftCache = new HashMap<>();
		Map<Long, AirportResponse> airportCache = new HashMap<>();

		List<FlightResponse> responses = new ArrayList<>();

		for (Flight flight : saved) {

			var aircraft = aircraftCache.computeIfAbsent(
					flight.getAircraftId(),
					airlineClient::getAircraftById
			);

			var departure = airportCache.computeIfAbsent(
					flight.getDepartureAirportId(),
					this::getAirport
			);

			var arrival = airportCache.computeIfAbsent(
					flight.getArrivalAirportId(),
					this::getAirport
			);

			responses.add(
					FlightMapper.toResponse(flight, aircraft, airline, departure, arrival)
			);
		}

		return responses;
	}

	// =========================
	// GET BY ID
	// =========================
	@Override
	@Transactional(readOnly = true)
	public FlightResponse getFlightById(Long id) {

		Flight flight = flightRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_NOT_FOUND));

		return getFlightResponse(flight);
	}

	// =========================
	// GET BY NUMBER
	// =========================
	@Override
	@Transactional(readOnly = true)
	public FlightResponse getFlightByNumber(String flightNumber) {

		Flight flight = flightRepository.findByFlightNumber(flightNumber)
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_NOT_FOUND));

		return getFlightResponse(flight);
	}

	// =========================
	// LIST BY AIRLINE
	// =========================
	@Override
	@Transactional(readOnly = true)
	public Page<FlightResponse> getFlightsByAirline(Long userId, Long departureAirportId,
			Long arrivalAirportId, Pageable pageable) {

		Long airlineId = getAirlineForUser(userId);

		return flightRepository
				.findByAirlineIdAndOptionalRoute(airlineId, departureAirportId, arrivalAirportId, pageable)
				.map(this::getFlightResponse);
	}

	// =========================
	// UPDATE FLIGHT
	// =========================
	@Override
	public FlightResponse updateFlight(Long userId, Long id, FlightRequest request) {

		Flight existing = requireOwnedFlight(userId, id);
		normalizeAndValidateRoute(request);

		if (request.getFlightNumber() != null
				&& flightRepository.existsByFlightNumberAndIdNot(request.getFlightNumber(), id)) {
			throw new BaseException(ErrorCode.FLIGHT_ALREADY_EXISTS);
		}

		validateAircraftOwnership(request.getAircraftId(), existing.getAirlineId());
		FlightMapper.updateEntity(request, existing);

		Flight saved = flightRepository.save(existing);

		return getFlightResponse(saved);
	}

	// =========================
	// CHANGE STATUS
	// =========================
	@Override
	public FlightResponse changeStatus(Long userId, Long id, FlightStatus status) {

		Flight flight = requireOwnedFlight(userId, id);
		if (status != FlightStatus.SCHEDULED && status != FlightStatus.CANCELLED) {
			throw new BaseException(ErrorCode.INVALID_FLIGHT_STATUS_TRANSITION);
		}

		flight.setStatus(status);

		return getFlightResponse(flight);
	}

	// =========================
	// DELETE
	// =========================
	@Override
	public void deleteFlight(Long userId, Long id) {

		Flight flight = requireOwnedFlight(userId, id);
		flight.setStatus(FlightStatus.CANCELLED);
		flightRepository.save(flight);
	}

	// =========================
	// GET BY IDS
	// =========================
	@Override
	@Transactional(readOnly = true)
	public Map<Long, FlightResponse> getFlightsByIds(List<Long> ids) {

		if (ids == null || ids.isEmpty()) return Map.of();

		List<Flight> flights = flightRepository.findAllById(ids);

		Map<Long, AirlineResponse> airlineCache = new HashMap<>();
		Map<Long, AircraftResponse> aircraftCache = new HashMap<>();
		Map<Long, AirportResponse> airportCache = new HashMap<>();

		Map<Long, FlightResponse> result = new HashMap<>();

		for (Flight flight : flights) {

			var airline = airlineCache.computeIfAbsent(
					flight.getAirlineId(),
					referenceDataService::getAirline
			);

			var aircraft = aircraftCache.computeIfAbsent(
					flight.getAircraftId(),
					referenceDataService::getAircraft
			);

			var departure = airportCache.computeIfAbsent(
					flight.getDepartureAirportId(),
					referenceDataService::getAirport
			);

			var arrival = airportCache.computeIfAbsent(
					flight.getArrivalAirportId(),
					referenceDataService::getAirport
			);

			result.put(
					flight.getId(),
					FlightMapper.toResponse(flight, aircraft, airline, departure, arrival)
			);
		}

		return result;
	}

	// =========================
	// HELPERS
	// =========================
	private AirportResponse getAirport(Long id) {
		return locationClient.getAirportById(id);
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

	private void validateAircraftOwnership(Long aircraftId, Long airlineId) {
		try {
			AircraftResponse aircraft = airlineClient.getAircraftById(aircraftId);
			if (!airlineId.equals(aircraft.getAirlineId())) {
				throw new BaseException(ErrorCode.FLIGHT_RESOURCE_NOT_OWNED);
			}
		} catch (FeignException.NotFound e) {
			throw new BaseException(ErrorCode.AIRCRAFT_NOT_FOUND);
		} catch (FeignException e) {
			throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
		}
	}

	private Flight requireOwnedFlight(Long userId, Long id) {
		Flight flight = flightRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_NOT_FOUND));
		if (!flight.getAirlineId().equals(getAirlineForUser(userId))) {
			throw new BaseException(ErrorCode.FLIGHT_RESOURCE_NOT_OWNED);
		}
		return flight;
	}

	private void normalizeAndValidateRoute(FlightRequest request) {
		request.setFlightNumber(request.getFlightNumber().trim().toUpperCase());
		if (request.getDepartureAirportId().equals(request.getArrivalAirportId())) {
			throw new BaseException(ErrorCode.INVALID_FLIGHT_ROUTE);
		}
		getAirport(request.getDepartureAirportId());
		getAirport(request.getArrivalAirportId());
	}

	private FlightResponse getFlightResponse(Flight flight) {

		AircraftResponse aircraft = referenceDataService.getAircraft(flight.getAircraftId());
		AirlineResponse airline = referenceDataService.getAirline(flight.getAirlineId());
		AirportResponse departure = referenceDataService.getAirport(flight.getDepartureAirportId());
		AirportResponse arrival = referenceDataService.getAirport(flight.getArrivalAirportId());

		return FlightMapper.toResponse(flight, aircraft, airline, departure, arrival);
	}
}
