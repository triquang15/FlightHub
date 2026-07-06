package com.triquang.client;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
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

	@PostMapping("/api/airlines/references/batch")
	ApiResponse<Map<Long, AirlineResponse>> getAirlinesByIdsResponse(@RequestBody List<Long> ids);

	default Map<Long, AirlineResponse> getAirlinesByIds(List<Long> ids) {
		ApiResponse<Map<Long, AirlineResponse>> response = getAirlinesByIdsResponse(ids);
		if (response == null || response.data() == null || response.errorCode() != null) {
			throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
		}
		return response.data();
	}

}
