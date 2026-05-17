package com.triquang.controller;

import com.triquang.payload.request.CityRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.CityResponse;
import com.triquang.service.CityService;
import com.triquang.utils.ResponseUtil;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/cities")
@RequiredArgsConstructor
public class CityController {

    private final CityService cityService;

    // CREATE
    @PostMapping
    public ResponseEntity<ApiResponse<CityResponse>> createCity(
            @Valid @RequestBody CityRequest request) {
        return ResponseUtil.created(cityService.createCity(request));
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CityResponse>> getCityById(@PathVariable Long id) {
        return ResponseUtil.ok(cityService.getCityById(id));
    }

    // PAGINATION (ADMIN)
    @GetMapping
    public ResponseEntity<ApiResponse<Page<CityResponse>>> getAllCities(Pageable pageable) {
        return ResponseUtil.ok(cityService.getAllCities(pageable));
    }

    // 🔥 DROPDOWN (MAIN FE)
    @GetMapping("/dropdown")
    public ResponseEntity<ApiResponse<List<CityResponse>>> getCitiesDropdown() {
        return ResponseUtil.ok(cityService.getCitiesDropdown());
    }

    // 🔥 SEARCH
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<CityResponse>>> searchCities(
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        return ResponseUtil.ok(cityService.searchCities(keyword, pageable));
    }

    // BY COUNTRY
    @GetMapping("/country/{countryCode}")
    public ResponseEntity<ApiResponse<Page<CityResponse>>> getByCountry(
            @PathVariable String countryCode,
            Pageable pageable) {
        return ResponseUtil.ok(
                cityService.getCitiesByCountryCode(countryCode.toUpperCase(), pageable)
        );
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CityResponse>> updateCity(
            @PathVariable Long id,
            @Valid @RequestBody CityRequest request) {
        return ResponseUtil.ok(cityService.updateCity(id, request));
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCity(@PathVariable Long id) {
        cityService.deleteCity(id);
        return ResponseUtil.noContent();
    }
}