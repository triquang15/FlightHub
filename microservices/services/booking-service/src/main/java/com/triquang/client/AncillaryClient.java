package com.triquang.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import com.triquang.payload.response.FlightCabinAncillaryResponse;
import com.triquang.payload.response.FlightMealResponse;
import com.triquang.payload.response.ApiResponse;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;

@FeignClient(name = "ancillary-service", fallback = AncillaryClientFallback.class)
public interface AncillaryClient {

	@PostMapping("/api/flight-cabin-ancillaries/price/total")
	ApiResponse<Double> calculateAncillariesPriceResponse(@RequestBody List<Long> flightCabinAncillaryIds);

	default double calculateAncillariesPrice(List<Long> ids) {
		return requireData(calculateAncillariesPriceResponse(ids));
	}

	@GetMapping("/api/flight-cabin-ancillaries/all")
	ApiResponse<List<FlightCabinAncillaryResponse>> getAllByIdsResponse(@RequestParam List<Long> Ids);

	default List<FlightCabinAncillaryResponse> getAllByIds(List<Long> ids) {
		return requireData(getAllByIdsResponse(ids));
	}

	@GetMapping("/api/flight-meals/all")
	ApiResponse<List<FlightMealResponse>> getMealsByIdsResponse(@RequestParam List<Long> Ids);

	default List<FlightMealResponse> getMealsByIds(List<Long> ids) {
		return requireData(getMealsByIdsResponse(ids));
	}

	@PostMapping("/api/flight-meals/price/total")
	ApiResponse<Double> calculateMealPriceResponse(@RequestBody List<Long> requests);

	default Double calculateMealPrice(List<Long> ids) {
		return requireData(calculateMealPriceResponse(ids));
	}

	private static <T> T requireData(ApiResponse<T> response) {
		if (response == null || response.data() == null) {
			throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
		}
		return response.data();
	}

}
