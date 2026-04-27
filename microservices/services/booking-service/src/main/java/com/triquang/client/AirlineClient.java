package com.triquang.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import com.triquang.payload.response.AirlineResponse;

@FeignClient(name = "airline-core-service")
public interface AirlineClient {

	@GetMapping("/api/airlines/admin")
	AirlineResponse getAirlineByOwner(@RequestHeader("X-User-Id") Long userId);

}
