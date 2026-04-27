package com.triquang.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import com.triquang.payload.response.FlightCabinAncillaryResponse;
import com.triquang.payload.response.FlightMealResponse;

@FeignClient(name = "ancillary-service", fallback = AncillaryClientFallback.class)
public interface AncillaryClient {

	@PostMapping("/api/flight-cabin-ancillaries/price/total")
	double calculateAncillariesPrice(@RequestBody List<Long> flightCabinAncillaryIds);

	@GetMapping("/api/flight-cabin-ancillaries/all")
	List<FlightCabinAncillaryResponse> getAllByIds(@RequestParam List<Long> Ids);

	@GetMapping("/api/flight-meals/all")
	List<FlightMealResponse> getMealsByIds(@RequestParam List<Long> Ids);

	@PostMapping("/api/flight-meals/price/total")
	Double calculateMealPrice(@RequestBody List<Long> requests);

}
