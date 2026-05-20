package com.triquang.controller;

import com.triquang.payload.request.CityRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.CityResponse;
import com.triquang.payload.response.TimezoneResponse;
import com.triquang.service.CityService;
import com.triquang.service.TimezoneService;
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
    private final TimezoneService timezoneService;

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
    
    @GetMapping
    public ResponseEntity<Page<CityResponse>> getAllCities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection,

            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String timezone,
            @RequestParam(required = false) String region
    ) {

        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(
            cityService.searchAdvanced(keyword, country, timezone, region, pageable)
        );
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
    
    @GetMapping("/timezones")
    public ResponseEntity<List<TimezoneResponse>> getTimezones(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String region
    ) {
        return ResponseEntity.ok(
                timezoneService.getAll(keyword, region)
        );
    }
}