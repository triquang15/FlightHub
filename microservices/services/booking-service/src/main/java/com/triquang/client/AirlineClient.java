package com.triquang.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.ApiResponse;

@FeignClient(name = "airline-core-service")
public interface AirlineClient {

	@GetMapping("/api/airlines/admin")
	ApiResponse<List<AirlineResponse>> getAirlinesByOwnerResponse(@RequestHeader("X-User-Id") Long userId);

	default AirlineResponse getAirlineByOwner(Long userId) {
		ApiResponse<List<AirlineResponse>> response = getAirlinesByOwnerResponse(userId);
		if (response == null || response.data() == null || response.data().isEmpty()) {
			return null;
		}
		return response.data().get(0);
	}

}
