package com.triquang.client;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.triquang.payload.response.FlightCabinAncillaryResponse;
import com.triquang.payload.response.FlightMealResponse;

@Component
public class AncillaryClientFallback implements AncillaryClient {

	@Override
	public double calculateAncillariesPrice(List<Long> flightCabinAncillaryIds) {
		return 0.0;
	}

	@Override
	public List<FlightCabinAncillaryResponse> getAllByIds(List<Long> Ids) {
		return Collections.emptyList();
	}

	@Override
	public List<FlightMealResponse> getMealsByIds(List<Long> Ids) {
		return Collections.emptyList();
	}

	@Override
	public Double calculateMealPrice(List<Long> requests) {
		return 0.0;
	}
}
