package com.triquang.controller;

import java.util.Collections;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.fallback.BaseFallback;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/fallback/location")
public class LocationFallbackController extends BaseFallback {

    @RequestMapping("/api/**")
    public ResponseEntity<?> fallback(HttpServletRequest request) {
        log(request, "location-service");
        return ResponseEntity.ok(Collections.emptyList());
    }
}
