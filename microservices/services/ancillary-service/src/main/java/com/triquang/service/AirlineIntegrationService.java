package com.triquang.service;

import com.triquang.payload.response.AircraftResponse;

public interface AirlineIntegrationService {
	Long getAirlineIdForUser(Long userId);

	AircraftResponse getAircraftById(Long aircraftId);
}
