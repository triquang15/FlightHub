package com.triquang.client;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.AircraftResponse;
import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.ApiResponse;

@Component
public class AirlineClientFallback implements AirlineClient {

	@Override
	public ApiResponse<List<AirlineResponse>> getAirlinesByOwnerResponse(Long userId) {
		return null;
	}

	@Override
	public ApiResponse<AirlineResponse> getAirlineByIdResponse(Long airlineId) {
		return null;
	}

	@Override
	public ApiResponse<AircraftResponse> getAircraftByIdResponse(Long id) {
		return null;
	}

	@Override
	public List<AirlineResponse> getAirlinesByIataCodes(List<String> codes) {
		return Collections.emptyList();
	}

	@Override
	public List<AirlineResponse> getAirlinesByAlliance(String alliance) {
		return Collections.emptyList();
	}
}
