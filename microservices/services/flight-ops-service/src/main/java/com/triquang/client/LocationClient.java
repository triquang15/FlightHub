package com.triquang.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.triquang.payload.response.AirportResponse;

@FeignClient(name = "location-service", fallback = LocationClientFallback.class)
public interface LocationClient {

    @GetMapping("/api/airports/{id}")
    AirportResponse getAirportById(@PathVariable Long id);
}
