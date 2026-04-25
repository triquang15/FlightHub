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

	// =========================
	// CREATE
	// =========================
	@PostMapping
	public ResponseEntity<ApiResponse<CityResponse>> createCity(@Valid @RequestBody CityRequest request) {

		return ResponseUtil.created(cityService.createCity(request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	public ResponseEntity<ApiResponse<List<CityResponse>>> createBulkCities(@RequestBody List<CityRequest> requests) {

		return ResponseUtil.created(cityService.createBulkCities(requests));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<CityResponse>> getCityById(@PathVariable Long id) {

		return ResponseUtil.ok(cityService.getCityById(id));
	}

	// =========================
	// GET ALL
	// =========================
	@GetMapping
	public ResponseEntity<ApiResponse<Page<CityResponse>>> getAllCities(@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "name") String sortBy,
			@RequestParam(defaultValue = "asc") String sortDirection) {

		Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(sortDirection), sortBy));

		return ResponseUtil.ok(cityService.getAllCities(pageable));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<CityResponse>> updateCity(@PathVariable Long id,
			@Valid @RequestBody CityRequest request) {

		return ResponseUtil.ok(cityService.updateCity(id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteCity(@PathVariable Long id) {

		cityService.deleteCity(id);

		return ResponseUtil.noContent(); // 204 chuẩn
	}

	// =========================
	// SEARCH
	// =========================
	@GetMapping("/search")
	public ResponseEntity<ApiResponse<Page<CityResponse>>> searchCities(@RequestParam String keyword,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {

		Pageable pageable = PageRequest.of(page, size);

		return ResponseUtil.ok(cityService.searchCities(keyword, pageable));
	}

	// =========================
	// BY COUNTRY
	// =========================
	@GetMapping("/country/{countryCode}")
	public ResponseEntity<ApiResponse<Page<CityResponse>>> getByCountry(@PathVariable String countryCode,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {

		Pageable pageable = PageRequest.of(page, size);

		return ResponseUtil.ok(cityService.getCitiesByCountryCode(countryCode.toUpperCase(), pageable));
	}

	// =========================
	// EXISTS
	// =========================
	@GetMapping("/exists/{cityCode}")
	public ResponseEntity<ApiResponse<Boolean>> cityExists(@PathVariable String cityCode) {

		return ResponseUtil.ok(cityService.cityExists(cityCode.toUpperCase()));
	}
}