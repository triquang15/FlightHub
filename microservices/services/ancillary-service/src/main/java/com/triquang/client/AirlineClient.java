package com.triquang.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import com.triquang.payload.response.AirlineResponse;
import com.triquang.payload.response.ApiResponse;

import java.util.List;

@FeignClient(name = "airline-core-service", fallback = AirlineClientFallback.class)
public interface AirlineClient {

    @GetMapping("/api/airlines/admin")
    ApiResponse<List<AirlineResponse>> getAirlinesByOwnerResponse(@RequestHeader("X-User-Id") Long userId);

    default List<AirlineResponse> getAirlinesByOwner(Long userId) {
        ApiResponse<List<AirlineResponse>> response = getAirlinesByOwnerResponse(userId);
        return response != null ? response.data() : null;
    }
}
