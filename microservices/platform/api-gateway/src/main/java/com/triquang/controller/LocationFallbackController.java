package com.triquang.controller;

import java.util.Collections;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.fallback.BaseFallback;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/fallback/location")
@Tag(name = "Gateway Fallbacks", description = "Circuit-breaker fallback endpoints exposed by API Gateway.")
public class LocationFallbackController extends BaseFallback {

    @RequestMapping("/api/**")
    @Operation(summary = "Location service fallback", description = "Returns an empty fallback response when Location Service is unreachable through the gateway circuit breaker.")
    public ResponseEntity<?> fallback(HttpServletRequest request) {
        log(request, "location-service");
        return ResponseEntity.ok(Collections.emptyList());
    }
}
