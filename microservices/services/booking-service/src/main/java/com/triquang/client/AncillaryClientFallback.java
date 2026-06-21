package com.triquang.client;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.FlightCabinAncillaryResponse;
import com.triquang.payload.response.FlightMealResponse;
import com.triquang.payload.response.ApiResponse;
import com.triquang.enums.ErrorCode;

@Component
public class AncillaryClientFallback implements AncillaryClient {

	@Override
	public ApiResponse<Double> calculateAncillariesPriceResponse(List<Long> flightCabinAncillaryIds) {
		return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "ancillary-service-fallback");
	}

	@Override
	public ApiResponse<List<FlightCabinAncillaryResponse>> getAllByIdsResponse(List<Long> Ids) {
		return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "ancillary-service-fallback");
	}

	@Override
	public ApiResponse<List<FlightMealResponse>> getMealsByIdsResponse(List<Long> Ids) {
		return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "ancillary-service-fallback");
	}

	@Override
	public ApiResponse<Double> calculateMealPriceResponse(List<Long> requests) {
		return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "ancillary-service-fallback");
	}
}
