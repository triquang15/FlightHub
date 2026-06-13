package com.triquang.service.impl;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.client.LocationClient;
import com.triquang.enums.ErrorCode;
import com.triquang.enums.FlightStatus;
import com.triquang.exception.BaseException;
import com.triquang.mapper.FlightScheduleMapper;
import com.triquang.model.Flight;
import com.triquang.model.FlightSchedule;
import com.triquang.payload.request.FlightInstanceRequest;
import com.triquang.payload.request.FlightScheduleRequest;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.payload.response.FlightScheduleResponse;
import com.triquang.repository.FlightRepository;
import com.triquang.repository.FlightScheduleRepository;
import com.triquang.service.AirlineIntegrationService;
import com.triquang.service.FlightInstanceService;
import com.triquang.service.FlightScheduleService;
import com.triquang.service.ScheduleDateTimePolicy;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class FlightScheduleServiceImpl implements FlightScheduleService {

	private final FlightScheduleRepository flightScheduleRepository;
	private final FlightRepository flightRepository;
	private final FlightInstanceService flightInstanceService;
	private final AirlineIntegrationService airlineIntegrationService;
	private final LocationClient locationClient;
	private final ScheduleDateTimePolicy dateTimePolicy;

	// ---------- CREATE ----------
	@Override
	public FlightScheduleResponse createFlightSchedule(Long userId, FlightScheduleRequest request) {

		Flight flight = flightRepository.findById(request.getFlightId())
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_NOT_FOUND));
		requireOwnership(userId, flight);
		validateSchedule(request, flight);

		FlightSchedule schedule = FlightScheduleMapper.toEntity(request, flight);
		FlightSchedule savedSchedule = flightScheduleRepository.save(schedule);

		AircraftResponse aircraft = airlineIntegrationService.getAircraftById(flight.getAircraftId());

		generateInstances(userId, savedSchedule, aircraft);

		return getFlightScheduleResponse(savedSchedule);
	}

	private void generateInstances(Long userId, FlightSchedule schedule, AircraftResponse aircraft) {
		Flight flight = schedule.getFlight();
		ZoneId departureZone = ZoneId.of(locationClient.getAirportById(schedule.getDepartureAirportId()).getTimeZone());
		ZoneId arrivalZone = ZoneId.of(locationClient.getAirportById(schedule.getArrivalAirportId()).getTimeZone());
		var flightInstanceRequest = FlightInstanceRequest.builder()
				.scheduleId(schedule.getId())
				.flightId(flight.getId())
				.arrivalAirportId(flight.getArrivalAirportId())
				.departureAirportId(flight.getDepartureAirportId())
				.totalSeats(aircraft.getTotalSeats())
				.status(FlightStatus.SCHEDULED)
				.build();

		for (LocalDate date = schedule.getStartDate(); !date.isAfter(schedule.getEndDate()); date = date.plusDays(1)) {
			if (schedule.getOperatingDays().contains(date.getDayOfWeek())) {
				flightInstanceRequest.setDepartureDateTime(
						dateTimePolicy.departure(date, schedule.getDepartureTime()));

				flightInstanceRequest.setArrivalDateTime(
						dateTimePolicy.arrival(date, schedule.getDepartureTime(), departureZone,
								schedule.getArrivalTime(), arrivalZone));

				flightInstanceService.createFlightInstanceWithCabins(userId, flightInstanceRequest);
			}
		}
	}

	// ---------- GET BY ID ----------
	@Override
	public FlightScheduleResponse getFlightScheduleById(Long id) {

		var schedule = flightScheduleRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_SCHEDULE_NOT_FOUND));

		return getFlightScheduleResponse(schedule);
	}

	// ---------- GET BY AIRLINE ----------
	@Override
	public List<FlightScheduleResponse> getFlightScheduleByAirline(Long userId) {

		Long airlineId = airlineIntegrationService.getAirlineIdForUser(userId);

		List<FlightSchedule> schedules =
				flightScheduleRepository.findByFlightAirlineId(airlineId);

		return schedules.stream()
				.map(schedule -> {
					try {
						return getFlightScheduleResponse(schedule);
					} catch (Exception e) {
						throw new BaseException(ErrorCode.INTERNAL_ERROR);
					}
				})
				.collect(Collectors.toList());
	}

	// ---------- UPDATE ----------
	@Override
	public FlightScheduleResponse updateFlightSchedule(Long userId, Long id, FlightScheduleRequest request) {

		var existing = flightScheduleRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_SCHEDULE_NOT_FOUND));
		requireOwnership(userId, existing.getFlight());
		validateSchedule(request, existing.getFlight());

		FlightScheduleMapper.updateEntity(request, existing);

		FlightSchedule saved = flightScheduleRepository.save(existing);
		if (Boolean.TRUE.equals(saved.getIsActive())) {
			generateInstances(userId, saved, airlineIntegrationService.getAircraftById(saved.getFlight().getAircraftId()));
		}

		return getFlightScheduleResponse(saved);
	}

	// ---------- DELETE ----------
	@Override
	public void deleteFlightSchedule(Long userId, Long id) {

		FlightSchedule schedule = flightScheduleRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_SCHEDULE_NOT_FOUND));
		requireOwnership(userId, schedule.getFlight());

		schedule.setIsActive(false);
		flightScheduleRepository.save(schedule);
	}

	private void requireOwnership(Long userId, Flight flight) {
		if (!flight.getAirlineId().equals(airlineIntegrationService.getAirlineIdForUser(userId))) {
			throw new BaseException(ErrorCode.FLIGHT_RESOURCE_NOT_OWNED);
		}
	}

	private void validateSchedule(FlightScheduleRequest request, Flight flight) {
		if (request.getEndDate().isBefore(request.getStartDate())
				|| request.getOperatingDays() == null || request.getOperatingDays().isEmpty()) {
			throw new BaseException(ErrorCode.INVALID_INPUT);
		}
		Long departureId = request.getDepartureAirportId() != null
				? request.getDepartureAirportId() : flight.getDepartureAirportId();
		Long arrivalId = request.getArrivalAirportId() != null
				? request.getArrivalAirportId() : flight.getArrivalAirportId();
		if (!departureId.equals(flight.getDepartureAirportId()) || !arrivalId.equals(flight.getArrivalAirportId())) {
			throw new BaseException(ErrorCode.INVALID_FLIGHT_ROUTE);
		}
		validateTimeZone(locationClient.getAirportById(departureId).getTimeZone());
		validateTimeZone(locationClient.getAirportById(arrivalId).getTimeZone());
	}

	private void validateTimeZone(String timeZone) {
		try {
			ZoneId.of(timeZone);
		} catch (Exception e) {
			throw new BaseException(ErrorCode.INVALID_TIMEZONE);
		}
	}

	// ---------- RESPONSE MAPPER ----------
	public FlightScheduleResponse getFlightScheduleResponse(FlightSchedule schedule) {

		var arrivalAirport = locationClient.getAirportById(schedule.getArrivalAirportId());
		var departureAirport = locationClient.getAirportById(schedule.getDepartureAirportId());

		return FlightScheduleMapper.toResponse(schedule, arrivalAirport, departureAirport);
	}
}
