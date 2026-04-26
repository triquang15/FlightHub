package com.triquang.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.payload.request.AirportRequest;
import com.triquang.payload.response.AirportResponse;
import com.triquang.payload.response.ApiResponse;
import com.triquang.service.AirportService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/airports")
@RequiredArgsConstructor
public class AirportController {

	private final AirportService airportService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	public ResponseEntity<ApiResponse<AirportResponse>> createAirport(@Valid @RequestBody AirportRequest request) {

		return ResponseUtil.created(airportService.createAirport(request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	public ResponseEntity<ApiResponse<List<AirportResponse>>> createBulkAirports(
			@Valid @RequestBody List<AirportRequest> requests) {

		return ResponseUtil.created(airportService.createBulkAirports(requests));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id}")
	public ResponseEntity<ApiResponse<AirportResponse>> getAirportById(@PathVariable Long id) {

		return ResponseUtil.ok(airportService.getAirportById(id));
	}

	// =========================
	// GET ALL
	// =========================
	@GetMapping
	public ResponseEntity<ApiResponse<List<AirportResponse>>> getAllAirports() {

		return ResponseUtil.ok(airportService.getAllAirports());
	}

	// =========================
	// GET BY CITY
	// =========================
	@GetMapping("/city/{cityId}")
	public ResponseEntity<ApiResponse<List<AirportResponse>>> getAirportsByCityId(@PathVariable Long cityId) {

		return ResponseUtil.ok(airportService.getAirportsByCityId(cityId));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<AirportResponse>> updateAirport(@PathVariable Long id,
			@Valid @RequestBody AirportRequest request) {

		return ResponseUtil.ok(airportService.updateAirport(id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> deleteAirport(@PathVariable Long id) {

	    airportService.deleteAirport(id);

	    return ResponseUtil.noContent();
	}
}