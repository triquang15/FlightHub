package com.triquang.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.triquang.payload.response.CabinClassResponse;
import com.triquang.payload.response.ApiResponse;

import java.util.List;

@FeignClient(name = "seat-service", fallback = SeatClientFallback.class)
public interface SeatClient {

	@GetMapping("/api/cabin-classes/aircraft/{aircraftId}")
	ApiResponse<List<CabinClassResponse>> getCabinClassesByAircraftIdResponse(@PathVariable Long aircraftId);

	default List<CabinClassResponse> getCabinClassesByAircraftId(Long aircraftId) {
		ApiResponse<List<CabinClassResponse>> response = getCabinClassesByAircraftIdResponse(aircraftId);
		return response != null ? response.data() : null;
	}
}
