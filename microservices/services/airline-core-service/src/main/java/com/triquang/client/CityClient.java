package com.triquang.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.CityResponse;


@FeignClient(
    name = "location-service",
    path = "/api/cities"
)
public interface CityClient {

    @GetMapping("/{id}")
    ApiResponse<CityResponse> getCityById(@PathVariable("id") Long id);
}