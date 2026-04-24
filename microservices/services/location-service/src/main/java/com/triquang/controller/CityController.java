package com.triquang.controller;

import com.triquang.payload.request.CityRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.CityResponse;
import com.triquang.service.CityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/cities")
@RequiredArgsConstructor
public class CityController {

    private final CityService cityService;

    // =========================
    // CREATE CITY
    // =========================
    @PostMapping
    public ResponseEntity<ApiResponse<CityResponse>> createCity(
            @Valid @RequestBody CityRequest request) {

        CityResponse response = cityService.createCity(request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "City created successfully"));
    }

    // =========================
    // BULK CREATE
    // =========================
    @PostMapping("/bulk")
    public ResponseEntity<ApiResponse<List<CityResponse>>> createBulkCities(
            @RequestBody List<CityRequest> requests) {

        List<CityResponse> response = cityService.createBulkCities(requests);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Bulk cities created successfully"));
    }

    // =========================
    // GET BY ID
    // =========================
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CityResponse>> getCityById(@PathVariable Long id) {

        CityResponse response = cityService.getCityById(id);

        return ResponseEntity.ok(
                ApiResponse.success(response, null)
        );
    }

    // =========================
    // GET ALL (PAGINATION)
    // =========================
    @GetMapping
    public ResponseEntity<ApiResponse<Page<CityResponse>>> getAllCities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {

        Pageable pageable = PageRequest.of(
                page,
                size,
                org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.fromString(sortDirection),
                        sortBy
                )
        );

        Page<CityResponse> response = cityService.getAllCities(pageable);

        return ResponseEntity.ok(
                ApiResponse.success(response, null)
        );
    }

    // =========================
    // UPDATE
    // =========================
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CityResponse>> updateCity(
            @PathVariable Long id,
            @Valid @RequestBody CityRequest request) {

        CityResponse response = cityService.updateCity(id, request);

        return ResponseEntity.ok(
                ApiResponse.success(response, "City updated successfully")
        );
    }

    // =========================
    // DELETE
    // =========================
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCity(@PathVariable Long id) {

        cityService.deleteCity(id);

        return ResponseEntity.ok(
                ApiResponse.success(null, "City deleted successfully")
        );
    }

    // =========================
    // SEARCH
    // =========================
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<CityResponse>>> searchCities(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);

        Page<CityResponse> response = cityService.searchCities(keyword, pageable);

        return ResponseEntity.ok(
                ApiResponse.success(response, null)
        );
    }

    // =========================
    // BY COUNTRY
    // =========================
    @GetMapping("/country/{countryCode}")
    public ResponseEntity<ApiResponse<Page<CityResponse>>> getByCountry(
            @PathVariable String countryCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);

        Page<CityResponse> response =
                cityService.getCitiesByCountryCode(countryCode.toUpperCase(), pageable);

        return ResponseEntity.ok(
                ApiResponse.success(response, null)
        );
    }

    // =========================
    // EXISTS CHECK
    // =========================
    @GetMapping("/exists/{cityCode}")
    public ResponseEntity<ApiResponse<Boolean>> cityExists(@PathVariable String cityCode) {

        boolean exists = cityService.cityExists(cityCode.toUpperCase());

        return ResponseEntity.ok(
                ApiResponse.success(exists, null)
        );
    }
}