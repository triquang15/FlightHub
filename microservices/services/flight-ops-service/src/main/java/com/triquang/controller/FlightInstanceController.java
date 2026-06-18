package com.triquang.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.payload.request.FlightInstanceRequest;
import com.triquang.enums.FlightStatus;
import com.triquang.service.FlightInstanceService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/flight-instances")
@Tag(name = "Flight Instances", description = "Manage dated flight operations and the SCHEDULED to ARRIVED or CANCELLED lifecycle.")
@RequiredArgsConstructor
public class FlightInstanceController {

	private final FlightInstanceService flightInstanceService;

	// =========================
	// CREATE
	// =========================
	@Operation(summary = "Create flight instance", description = "Creates an owned dated flight instance and initializes downstream cabin inventory.")
	@PostMapping
	public ResponseEntity<?> createFlightInstance(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody FlightInstanceRequest request) {

		return ResponseUtil.created(flightInstanceService.createFlightInstanceWithCabins(userId, request));
	}

	// =========================
	// BATCH IDS
	// =========================
	@Operation(summary = "Get flight instances by IDs")
	@PostMapping("/batch")
	public ResponseEntity<?> getFlightInstancesByIds(@RequestBody List<Long> ids) {

		return ResponseUtil.ok(flightInstanceService.getFlightInstancesByIds(ids));
	}

	// =========================
	// GET BY ID
	// =========================
	@Operation(summary = "Get flight instance by ID")
	@GetMapping("/{id:\\d+}")
	public ResponseEntity<?> getFlightInstanceById(@PathVariable Long id) {

		return ResponseUtil.ok(flightInstanceService.getFlightInstanceById(id));
	}

	// =========================
	// GET ALL
	// =========================
	@Operation(summary = "List all flight instances", description = "Returns all flight instances for administrative read-only inventory views.")
	@GetMapping("/list")
	public ResponseEntity<?> getFlightInstances(Pageable pageable) {

		return ResponseUtil.ok(flightInstanceService.getFlightInstances(pageable));
	}

	@Operation(summary = "Get flight instance inventory summary", description = "Returns system-wide totals for administrative inventory cards.")
	@GetMapping("/inventory-summary")
	public ResponseEntity<?> getInventorySummary() {
		return ResponseUtil.ok(flightInstanceService.getInventorySummary());
	}

	// =========================
	// FILTER
	// =========================
	@Operation(summary = "List airline flight instances", description = "Returns paginated owned instances with optional route, flight, and operating-date filters.")
	@GetMapping
	public ResponseEntity<?> getByAirlineId(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@RequestParam(required = false) Long departureAirportId,
			@RequestParam(required = false) Long arrivalAirportId, @RequestParam(required = false) Long flightId,
			@RequestParam(required = false) LocalDate onDate, Pageable pageable) {

		return ResponseUtil.ok(flightInstanceService.getByAirlineId(userId, departureAirportId, arrivalAirportId,
				flightId, onDate, pageable));
	}

	// =========================
	// UPDATE
	// =========================
	@Operation(summary = "Update flight instance", description = "Updates mutable details of an owned scheduled flight instance.")
	@PutMapping("/{id:\\d+}")
	public ResponseEntity<?> updateFlightInstance(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
			@Valid @RequestBody FlightInstanceRequest request) {

		return ResponseUtil.ok(flightInstanceService.updateFlightInstance(userId, id, request));
	}

	@Operation(summary = "Advance flight instance lifecycle", description = "Applies a valid lifecycle transition: SCHEDULED to BOARDING, BOARDING to DEPARTED, DEPARTED to ARRIVED, or cancellation before arrival.")
	@PatchMapping("/{id:\\d+}/status")
	public ResponseEntity<?> changeStatus(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
			@RequestParam FlightStatus status) {
		return ResponseUtil.ok(flightInstanceService.changeStatus(userId, id, status));
	}

	// =========================
	// DELETE
	// =========================
	@Operation(summary = "Delete unbooked scheduled instance", description = "Deletes an owned SCHEDULED instance only when it has no bookings.")
	@DeleteMapping("/{id:\\d+}")
	public ResponseEntity<?> deleteFlightInstance(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {

		flightInstanceService.deleteFlightInstance(userId, id);

		return ResponseUtil.noContent();
	}
}
