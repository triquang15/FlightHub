package com.triquang.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.payload.request.PassengerRequest;
import com.triquang.service.PassengerService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/passengers")
@Tag(name = "Passengers", description = "Manage passenger profiles and lookup for booking creation.")
@RequiredArgsConstructor
public class PassengerController {

	private final PassengerService passengerService;

	// =========================
	// CREATE PASSENGER
	// =========================
	@Operation(summary = "Create passenger", description = "Creates a passenger profile for the authenticated user.")
	@ApiResponses({
		@ApiResponse(responseCode = "201", description = "Passenger created"),
		@ApiResponse(responseCode = "400", description = "Invalid passenger data")
	})
	@PostMapping
	public ResponseEntity<?> createPassenger(@Valid @RequestBody PassengerRequest request,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.created(passengerService.createPassenger(request, userId));
	}

	// =========================
	// FIND EXISTING PASSENGER
	// =========================
	@Operation(summary = "Find existing passenger", description = "Searches for an existing passenger using the provided contact and identity details.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Passenger search results returned"),
		@ApiResponse(responseCode = "400", description = "Invalid search criteria")
	})
	@PostMapping("/find")
	public ResponseEntity<?> findExistingPassenger(@RequestBody PassengerRequest request,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(passengerService.findExistingPassenger(request, userId));
	}

	// =========================
	// MY SAVED PASSENGERS
	// =========================
	@Operation(summary = "Get saved passengers", description = "Returns active passenger profiles saved by the authenticated user.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Passenger profiles returned"),
		@ApiResponse(responseCode = "401", description = "Authentication required")
	})
	@GetMapping("/me")
	public ResponseEntity<?> getSavedPassengers(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(passengerService.getSavedPassengers(userId));
	}

	// =========================
	// CHECK EXISTS
	// =========================
	@Operation(summary = "Check passenger exists", description = "Returns true when a passenger with the specified ID exists.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Passenger existence returned"),
		@ApiResponse(responseCode = "404", description = "Passenger not found")
	})
	@GetMapping("/{id}/exists")
	public ResponseEntity<?> existsById(@PathVariable Long id) {

		return ResponseUtil.ok(passengerService.existsById(id));
	}

	// =========================
	// COUNT
	// =========================
	@Operation(summary = "Count passengers", description = "Returns the total number of passenger profiles.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Passenger count returned")
	})
	@GetMapping("/count")
	public ResponseEntity<?> countPassengers() {

		return ResponseUtil.ok(passengerService.count());
	}
}
