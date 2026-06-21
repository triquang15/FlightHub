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
@RequestMapping("/fallback/ancillary")
@Tag(name = "Gateway Fallbacks", description = "Circuit-breaker fallback endpoints exposed by API Gateway.")
public class AncillaryFallbackController extends BaseFallback {

    @RequestMapping("/api/**")
    @Operation(summary = "Ancillary service fallback", description = "Returns an empty fallback response when Ancillary Service is unreachable through the gateway circuit breaker.")
    public ResponseEntity<?> fallback(HttpServletRequest request) {
        log(request, "ancillary-service");
        return ResponseEntity.ok(Collections.emptyList());
    }
}
