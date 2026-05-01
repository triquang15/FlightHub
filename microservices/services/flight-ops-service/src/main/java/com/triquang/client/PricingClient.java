package com.triquang.client;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import com.triquang.payload.response.FareResponse;

/**
 * Feign client for the pricing-service.
 *
 * <p>Used during flight search to fetch the cheapest fare per flight
 * for a given cabin class, enabling price-range filtering across
 * the result page in a single network call.
 */
@FeignClient(name = "pricing-service", fallbackFactory = PricingClientFallbackFactory.class)
public interface PricingClient {

    /**
     * Returns a map of {@code flightId → cheapest FareResponse} for each flight
     * that has at least one fare for the requested cabin class.
     *
     * <p>Flights with no fare for the given cabin class are absent from the map.
     *
     * @param flightIds  list of flight IDs to query
     * @param cabinClassId the requested cabin class
     */
	@PostMapping("/api/fares/search")
	Map<Long, FareResponse> getLowestFarePerFlight(@RequestBody List<Long> flightIds,
			@RequestParam("cabinClassId") Long cabinClassId);

	@GetMapping("/api/fares/lowest/flight/{flightId}/cabin-class/{cabinClassId}")
	FareResponse getLowestFareForFlightAndCabinClass(@PathVariable Long flightId, @PathVariable Long cabinClassId);
}