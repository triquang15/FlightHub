package com.triquang.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.payload.response.AirlineResponse;

@FeignClient(name = "airline-core-service", fallback = AirlineClientFallback.class)
public interface AirlineClient {

    @GetMapping("/api/airlines/admin")
    ApiResponse<List<AirlineResponse>> getAirlinesByOwnerResponse(@RequestHeader("X-User-Id") Long userId);

    @GetMapping("/api/aircrafts/{id}")
    AircraftResponse getAircraftById(@PathVariable("id") Long id);

    default AirlineResponse getAirlineByOwner(Long userId) {
        List<AirlineResponse> airlines = data(getAirlinesByOwnerResponse(userId));
        return airlines == null || airlines.isEmpty() ? null : airlines.get(0);
    }

    private static <T> T data(ApiResponse<T> response) {
        return response != null ? response.data() : null;
    }
}
