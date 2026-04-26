package com.triquang.service.impl;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
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

	// ---------- CREATE ----------
	@Override
	public FlightScheduleResponse createFlightSchedule(Long userId, FlightScheduleRequest request) {

		Flight flight = flightRepository.findById(request.getFlightId())
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_NOT_FOUND));

		if (request.getEndDate().isBefore(request.getStartDate())) {
			throw new BaseException(ErrorCode.INVALID_INPUT);
		}

		FlightSchedule schedule = FlightScheduleMapper.toEntity(request, flight);
		FlightSchedule savedSchedule = flightScheduleRepository.save(schedule);

		AircraftResponse aircraft = airlineIntegrationService.getAircraftById(flight.getAircraftId());

		List<DayOfWeek> operatingDays = schedule.getOperatingDays();
		LocalDate startDate = schedule.getStartDate();
		LocalDate endDate = schedule.getEndDate();

		var flightInstanceRequest = FlightInstanceRequest.builder()
				.scheduleId(savedSchedule.getId())
				.flightId(flight.getId())
				.arrivalAirportId(flight.getArrivalAirportId())
				.departureAirportId(flight.getDepartureAirportId())
				.totalSeats(aircraft.getTotalSeats())
				.status(FlightStatus.SCHEDULED)
				.build();

		for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
			if (operatingDays.contains(date.getDayOfWeek())) {
				flightInstanceRequest.setDepartureDateTime(
						LocalDateTime.of(date, schedule.getDepartureTime()));

				flightInstanceRequest.setArrivalDateTime(
						LocalDateTime.of(date, schedule.getArrivalTime()));

				flightInstanceService.createFlightInstanceWithCabins(userId, flightInstanceRequest);
			}
		}

		return getFlightScheduleResponse(savedSchedule);
	}

	// ---------- GET BY ID ----------
	@Override
	public FlightScheduleResponse getFlightScheduleById(Long id) {

		var schedule = flightScheduleRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_NOT_FOUND));

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
	public FlightScheduleResponse updateFlightSchedule(Long id, FlightScheduleRequest request) {

		var existing = flightScheduleRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_NOT_FOUND));

		FlightScheduleMapper.updateEntity(request, existing);

		FlightSchedule saved = flightScheduleRepository.save(existing);

		return getFlightScheduleResponse(saved);
	}

	// ---------- DELETE ----------
	@Override
	public void deleteFlightSchedule(Long id) {

		FlightSchedule schedule = flightScheduleRepository.findById(id)
				.orElseThrow(() -> new BaseException(ErrorCode.FLIGHT_NOT_FOUND));

		flightScheduleRepository.delete(schedule);
	}

	// ---------- RESPONSE MAPPER ----------
	public FlightScheduleResponse getFlightScheduleResponse(FlightSchedule schedule) {

		var arrivalAirport = locationClient.getAirportById(schedule.getArrivalAirportId());
		var departureAirport = locationClient.getAirportById(schedule.getDepartureAirportId());

		return FlightScheduleMapper.toResponse(schedule, arrivalAirport, departureAirport);
	}
}