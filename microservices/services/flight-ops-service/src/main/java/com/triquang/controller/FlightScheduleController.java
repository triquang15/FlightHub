package com.triquang.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.triquang.payload.request.FlightScheduleRequest;
import com.triquang.payload.response.FlightScheduleResponse;
import com.triquang.service.FlightScheduleService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/flight-schedules")
@RequiredArgsConstructor
public class FlightScheduleController {

	private final FlightScheduleService flightScheduleService;

	// ---------- CREATE ----------
	@PostMapping
	public ResponseEntity<?> createFlightSchedule(@RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody FlightScheduleRequest request) {

		FlightScheduleResponse response = flightScheduleService.createFlightSchedule(userId, request);

		return ResponseUtil.created(response);
	}

	// ---------- GET BY ID ----------
	@GetMapping("/{id}")
	public ResponseEntity<?> getFlightScheduleById(@PathVariable Long id) {

		FlightScheduleResponse response = flightScheduleService.getFlightScheduleById(id);

		return ResponseUtil.ok(response);
	}

	// ---------- GET BY AIRLINE ----------
	@GetMapping
	public ResponseEntity<?> getFlightSchedules(@RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(flightScheduleService.getFlightScheduleByAirline(userId));
	}

	// ---------- UPDATE ----------
	@PutMapping("/{id}")
	public ResponseEntity<?> updateFlightSchedule(@PathVariable Long id,
			@Valid @RequestBody FlightScheduleRequest request) {

		FlightScheduleResponse response = flightScheduleService.updateFlightSchedule(id, request);

		return ResponseUtil.ok(response);
	}

	// ---------- DELETE ----------
	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteFlightSchedule(@PathVariable Long id) {

		flightScheduleService.deleteFlightSchedule(id);

		return ResponseUtil.noContent();
	}
}