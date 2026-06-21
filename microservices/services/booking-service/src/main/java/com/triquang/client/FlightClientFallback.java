package com.triquang.client;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.triquang.enums.ErrorCode;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.FlightInstanceResponse;
import com.triquang.payload.response.FlightResponse;

@Component
public class FlightClientFallback implements FlightClient {

	@Override
	public ApiResponse<FlightResponse> getFlightByIdResponse(Long id) {
		return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "flight-ops-service-fallback");
	}

	@Override
	public ApiResponse<FlightInstanceResponse> getFlightInstanceResponseData(Long id) {
		return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "flight-ops-service-fallback");
	}

	@Override
	public ApiResponse<Map<Long, FlightResponse>> getFlightsByIdsResponse(List<Long> ids) {
		return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "flight-ops-service-fallback");
	}

	@Override
	public ApiResponse<Map<Long, FlightInstanceResponse>> getFlightInstancesByIdsResponse(List<Long> ids) {
		return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "flight-ops-service-fallback");
	}
}
