package com.triquang.client;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.FareResponse;

@Component
public class PricingClientFallback implements PricingClient {

	@Override
	public FareResponse getFareById(Long id) {
		return null;
	}

	@Override
	public Map<Long, FareResponse> getFaresByIds(List<Long> ids) {
		return Collections.emptyMap();
	}
}
