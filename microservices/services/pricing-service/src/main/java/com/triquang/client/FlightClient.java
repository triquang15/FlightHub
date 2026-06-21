package com.triquang.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.FlightResponse;

@FeignClient(name = "flight-ops-service", fallback = FlightClientFallback.class)
public interface FlightClient {

    @GetMapping("/api/flights/{id}")
    ApiResponse<FlightResponse> getFlightByIdResponse(@PathVariable Long id);

    default FlightResponse getFlightById(Long id) {
        ApiResponse<FlightResponse> response = getFlightByIdResponse(id);
        return response != null ? response.data() : null;
    }
}
