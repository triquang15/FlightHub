package com.triquang.controller;

import com.triquang.payload.request.AirportRequest;
import com.triquang.payload.response.AirportResponse;
import com.triquang.service.AirportService;
import com.triquang.service.GeoTimezoneService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/airports")
@RequiredArgsConstructor
public class AirportController {

    private final AirportService airportService;
    private final GeoTimezoneService geoTimezoneService;

    // ================= SEARCH =================
    @GetMapping
    public ResponseEntity<Page<AirportResponse>> getAirports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) Long cityId
    ) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.fromString(sortDirection), sortBy)
        );

        return ResponseEntity.ok(
                airportService.searchAirports(keyword, country, cityId, pageable)
        );
    }

    // ================= CREATE =================
    @PostMapping
    public ResponseEntity<AirportResponse> createAirport(
            @Valid @RequestBody AirportRequest request
    ) {
        return ResponseEntity.ok(airportService.createAirport(request));
    }

    // ================= BULK =================
    @PostMapping("/bulk")
    public ResponseEntity<List<AirportResponse>> createBulkAirports(
            @Valid @RequestBody List<AirportRequest> requests
    ) {
        return ResponseEntity.ok(
                airportService.createBulkAirports(requests)
        );
    }

    // ================= GET BY ID =================
    @GetMapping("/{id}")
    public ResponseEntity<AirportResponse> getAirport(@PathVariable Long id) {
        return ResponseEntity.ok(airportService.getAirportById(id));
    }

    // ================= UPDATE =================
    @PutMapping("/{id}")
    public ResponseEntity<AirportResponse> updateAirport(
            @PathVariable Long id,
            @Valid @RequestBody AirportRequest request
    ) {
        return ResponseEntity.ok(airportService.updateAirport(id, request));
    }

    // ================= DELETE =================
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAirport(@PathVariable Long id) {
        airportService.deleteAirport(id);
        return ResponseEntity.noContent().build();
    }

    // ================= DETECT TIMEZONE =================
    @GetMapping("/timezone/detect")
    public ResponseEntity<?> detectTimezone(
            @RequestParam double lat,
            @RequestParam double lng
    ) {
        String tz = geoTimezoneService.detect(lat, lng);

        if (tz == null) {
            return ResponseEntity.badRequest()
                    .body("Cannot detect timezone");
        }

        return ResponseEntity.ok(tz);
    }
}