package com.triquang.client;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.FlightInstanceResponse;
import com.triquang.payload.response.FlightResponse;

@FeignClient(name = "flight-ops-service", fallback = FlightClientFallback.class)
public interface FlightClient {
	@GetMapping("/api/flights/{id}")
	ApiResponse<FlightResponse> getFlightByIdResponse(@PathVariable Long id);

	default FlightResponse getFlightById(Long id) {
		return requireData(getFlightByIdResponse(id));
	}

	@GetMapping("/api/flight-instances/{id}")
	ApiResponse<FlightInstanceResponse> getFlightInstanceResponseData(@PathVariable Long id);

	default FlightInstanceResponse getFlightInstanceResponse(Long id) {
		return requireData(getFlightInstanceResponseData(id));
	}

	@PostMapping("/api/flights/batch")
	ApiResponse<Map<Long, FlightResponse>> getFlightsByIdsResponse(@RequestBody List<Long> ids);

	default Map<Long, FlightResponse> getFlightsByIds(List<Long> ids) {
		return requireData(getFlightsByIdsResponse(ids));
	}

	@PostMapping("/api/flight-instances/batch")
	ApiResponse<Map<Long, FlightInstanceResponse>> getFlightInstancesByIdsResponse(@RequestBody List<Long> ids);

	default Map<Long, FlightInstanceResponse> getFlightInstancesByIds(List<Long> ids) {
		return requireData(getFlightInstancesByIdsResponse(ids));
	}

	private static <T> T requireData(ApiResponse<T> response) {
		if (response == null || response.data() == null || response.errorCode() != null) {
			throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
		}
		return response.data();
	}
}
