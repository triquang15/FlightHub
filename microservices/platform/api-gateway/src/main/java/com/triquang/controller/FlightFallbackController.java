package com.triquang.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.fallback.BaseFallback;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/fallback/flight")
public class FlightFallbackController extends BaseFallback {

    @RequestMapping("/api/**")
    public ResponseEntity<?> fallback(HttpServletRequest request) {
        log(request, "flight-service");
        return ResponseEntity.status(503).body("Flight service down");
    }
}
