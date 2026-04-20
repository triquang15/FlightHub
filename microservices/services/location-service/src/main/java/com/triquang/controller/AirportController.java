package com.triquang.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.triquang.exception.AirportException;
import com.triquang.exception.CityException;
import com.triquang.payload.request.AirportRequest;
import com.triquang.payload.response.AirportResponse;
import com.triquang.payload.response.ApiResponse;
import com.triquang.service.AirportService;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/airports")
@RequiredArgsConstructor
public class AirportController {

    private final AirportService airportService;

    @PostMapping
    public ResponseEntity<AirportResponse> createAirport(@Valid @RequestBody AirportRequest request)
            throws AirportException, CityException {
        return ResponseEntity.status(HttpStatus.CREATED).body(airportService.createAirport(request));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<AirportResponse>> createBulkAirports(
            @Valid @RequestBody List<AirportRequest> requests)
            throws AirportException, CityException {
        return ResponseEntity.status(HttpStatus.CREATED).body(airportService.createBulkAirports(requests));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AirportResponse> getAirportById(@PathVariable Long id) throws AirportException {
        return ResponseEntity.ok(airportService.getAirportById(id));
    }


    @GetMapping
    public ResponseEntity<List<AirportResponse>> getAllAirports() {
        return ResponseEntity.ok(airportService.getAllAirports());
    }

    @GetMapping("/city/{cityId}")
    public ResponseEntity<List<AirportResponse>> getAirportsByCityId(@PathVariable Long cityId) {
        return ResponseEntity.ok(airportService.getAirportsByCityId(cityId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AirportResponse> updateAirport(
            @PathVariable Long id,
            @Valid @RequestBody AirportRequest request) throws AirportException, CityException {
        return ResponseEntity.ok(airportService.updateAirport(id, request));
    }

	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> deleteAirport(@PathVariable Long id) throws AirportException {

		airportService.deleteAirport(id);

		return ResponseEntity.ok(new ApiResponse<>(200, true, "Airport deleted successfully", null, Instant.now()));
	}
}
