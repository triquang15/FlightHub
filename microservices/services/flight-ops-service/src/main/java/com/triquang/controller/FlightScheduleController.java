package com.triquang.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.triquang.payload.request.FlightScheduleRequest;
import com.triquang.payload.response.FlightScheduleResponse;
import com.triquang.service.FlightScheduleService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/flight-schedules")
@Tag(name = "Flight Schedules", description = "Manage recurring schedules and idempotent flight-instance generation.")
@RequiredArgsConstructor
public class FlightScheduleController {

	private final FlightScheduleService flightScheduleService;

	// ---------- CREATE ----------
	@Operation(summary = "Create schedule", description = "Creates a recurring schedule and generates flight instances idempotently. Handles airport timezones and overnight arrivals.")
	@PostMapping
	public ResponseEntity<?> createFlightSchedule(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody FlightScheduleRequest request) {

		FlightScheduleResponse response = flightScheduleService.createFlightSchedule(userId, request);

		return ResponseUtil.created(response);
	}

	// ---------- GET BY ID ----------
	@Operation(summary = "Get schedule by ID")
	@GetMapping("/{id}")
	public ResponseEntity<?> getFlightScheduleById(@PathVariable Long id) {

		FlightScheduleResponse response = flightScheduleService.getFlightScheduleById(id);

		return ResponseUtil.ok(response);
	}

	// ---------- GET BY AIRLINE ----------
	@Operation(summary = "List airline schedules", description = "Returns schedules owned by the authenticated airline owner.")
	@GetMapping
	public ResponseEntity<?> getFlightSchedules(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(flightScheduleService.getFlightScheduleByAirline(userId));
	}

	// ---------- UPDATE ----------
	@Operation(summary = "Update schedule", description = "Updates an owned recurring schedule and safely generates missing instances.")
	@PutMapping("/{id}")
	public ResponseEntity<?> updateFlightSchedule(@PathVariable Long id,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody FlightScheduleRequest request) {

		FlightScheduleResponse response = flightScheduleService.updateFlightSchedule(userId, id, request);

		return ResponseUtil.ok(response);
	}

	// ---------- DELETE ----------
	@Operation(summary = "Deactivate schedule", description = "Deactivates an owned recurring schedule while preserving generated operational history.")
	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteFlightSchedule(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {

		flightScheduleService.deleteFlightSchedule(userId, id);

		return ResponseUtil.noContent();
	}
}
