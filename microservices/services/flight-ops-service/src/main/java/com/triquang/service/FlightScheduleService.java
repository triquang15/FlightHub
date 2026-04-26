package com.triquang.service;

import java.util.List;

import com.triquang.payload.request.FlightScheduleRequest;
import com.triquang.payload.response.FlightScheduleResponse;

public interface FlightScheduleService {

	FlightScheduleResponse createFlightSchedule(Long userId, FlightScheduleRequest request);

	FlightScheduleResponse getFlightScheduleById(Long id);

	List<FlightScheduleResponse> getFlightScheduleByAirline(Long userId);

	FlightScheduleResponse updateFlightSchedule(Long id, FlightScheduleRequest request);

	void deleteFlightSchedule(Long id);
}
