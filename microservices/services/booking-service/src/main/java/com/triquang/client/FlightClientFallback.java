package com.triquang.client;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.FlightInstanceResponse;
import com.triquang.payload.response.FlightResponse;

@Component
public class FlightClientFallback implements FlightClient {

	@Override
	public FlightResponse getFlightById(Long id) {
		return null;
	}

	@Override
	public FlightInstanceResponse getFlightInstanceResponse(Long id) {
		return null;
	}

	@Override
	public Map<Long, FlightResponse> getFlightsByIds(List<Long> ids) {
		return Collections.emptyMap();
	}

	@Override
	public Map<Long, FlightInstanceResponse> getFlightInstancesByIds(List<Long> ids) {
		return Collections.emptyMap();
	}
}
