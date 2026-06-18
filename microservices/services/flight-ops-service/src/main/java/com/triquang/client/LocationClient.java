package com.triquang.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.triquang.payload.response.AirportResponse;
import com.triquang.payload.response.ApiResponse;

@FeignClient(name = "location-service", fallback = LocationClientFallback.class)
public interface LocationClient {

    @GetMapping("/api/airports/{id}")
    ApiResponse<AirportResponse> getAirportByIdResponse(@PathVariable Long id);

    default AirportResponse getAirportById(Long id) {
        ApiResponse<AirportResponse> response = getAirportByIdResponse(id);
        return response != null ? response.data() : null;
    }
}
