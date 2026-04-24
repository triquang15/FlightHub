package com.triquang.controller;

import com.triquang.payload.request.AirportRequest;
import com.triquang.payload.response.AirportResponse;
import com.triquang.payload.response.ApiResponse;
import com.triquang.service.AirportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/airports")
@RequiredArgsConstructor
public class AirportController {

    private final AirportService airportService;

    // =========================
    // CREATE
    // =========================
    @PostMapping
    public ResponseEntity<ApiResponse<AirportResponse>> createAirport(
            @Valid @RequestBody AirportRequest request) {

        AirportResponse response = airportService.createAirport(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, null));
    }

    // =========================
    // BULK CREATE
    // =========================
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<List<AirportResponse>>> createBulkAirports(
            @Valid @RequestBody List<AirportRequest> requests) {

        List<AirportResponse> response = airportService.createBulkAirports(requests);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, null));
    }

    // =========================
    // GET BY ID
    // =========================
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AirportResponse>> getAirportById(@PathVariable Long id) {

        AirportResponse response = airportService.getAirportById(id);

        return ResponseEntity.ok(ApiResponse.success(response, null));
    }

    // =========================
    // GET ALL
    // =========================
    @GetMapping
    public ResponseEntity<ApiResponse<List<AirportResponse>>> getAllAirports() {

        List<AirportResponse> response = airportService.getAllAirports();

        return ResponseEntity.ok(ApiResponse.success(response, null));
    }

    // =========================
    // GET BY CITY
    // =========================
    @GetMapping("/city/{cityId}")
    public ResponseEntity<ApiResponse<List<AirportResponse>>> getAirportsByCityId(
            @PathVariable Long cityId) {

        List<AirportResponse> response = airportService.getAirportsByCityId(cityId);

        return ResponseEntity.ok(ApiResponse.success(response, null));
    }

    // =========================
    // UPDATE
    // =========================
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AirportResponse>> updateAirport(
            @PathVariable Long id,
            @Valid @RequestBody AirportRequest request) {

        AirportResponse response = airportService.updateAirport(id, request);

        return ResponseEntity.ok(ApiResponse.success(response, null));
    }

    // =========================
    // DELETE
    // =========================
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAirport(@PathVariable Long id) {

        airportService.deleteAirport(id);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        200,
                        null,
                        "Airport deleted successfully",
                        null,
                        null,
                        Instant.now()
                )
        );
    }
}