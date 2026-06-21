package com.triquang.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.fallback.BaseFallback;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/fallback/flight")
@Tag(name = "Gateway Fallbacks", description = "Circuit-breaker fallback endpoints exposed by API Gateway.")
public class FlightFallbackController extends BaseFallback {

    @RequestMapping("/api/**")
    @Operation(summary = "Flight service fallback", description = "Returns a service-unavailable response when Flight Ops Service is unreachable through the gateway circuit breaker.")
    public ResponseEntity<?> fallback(HttpServletRequest request) {
        log(request, "flight-service");
        return ResponseEntity.status(503).body("Flight service down");
    }
}
