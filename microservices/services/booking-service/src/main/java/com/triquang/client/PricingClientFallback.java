package com.triquang.client;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.triquang.enums.ErrorCode;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.FareResponse;

@Component
public class PricingClientFallback implements PricingClient {

	@Override
	public ApiResponse<FareResponse> getFareByIdResponse(Long id) {
		return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "pricing-service-fallback");
	}

	@Override
	public ApiResponse<Map<Long, FareResponse>> getFaresByIdsResponse(List<Long> ids) {
		return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "pricing-service-fallback");
	}
}
