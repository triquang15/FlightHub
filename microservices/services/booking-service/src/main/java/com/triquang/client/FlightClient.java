package com.triquang.client;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.triquang.payload.response.FlightInstanceResponse;
import com.triquang.payload.response.FlightResponse;

@FeignClient(name = "flight-ops-service", fallback = FlightClientFallback.class)
public interface FlightClient {
	@GetMapping("/api/flights/{id}")
	FlightResponse getFlightById(@PathVariable Long id);

	@GetMapping("/api/flight-instances/{id}")
	FlightInstanceResponse getFlightInstanceResponse(@PathVariable Long id);

	@PostMapping("/api/flights/batch")
	Map<Long, FlightResponse> getFlightsByIds(@RequestBody List<Long> ids);

	@PostMapping("/api/flight-instances/batch")
	Map<Long, FlightInstanceResponse> getFlightInstancesByIds(@RequestBody List<Long> ids);
}
