package com.triquang.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.payload.request.FlightInstanceRequest;
import com.triquang.service.FlightInstanceService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/flight-instances")
@RequiredArgsConstructor
public class FlightInstanceController {

	private final FlightInstanceService flightInstanceService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	public ResponseEntity<?> createFlightInstance(@RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody FlightInstanceRequest request) {

		return ResponseUtil.created(flightInstanceService.createFlightInstanceWithCabins(userId, request));
	}

	// =========================
	// BATCH IDS
	// =========================
	@PostMapping("/batch")
	public ResponseEntity<?> getFlightInstancesByIds(@RequestBody List<Long> ids) {

		return ResponseUtil.ok(flightInstanceService.getFlightInstancesByIds(ids));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id:\\d+}")
	public ResponseEntity<?> getFlightInstanceById(@PathVariable Long id) {

		return ResponseUtil.ok(flightInstanceService.getFlightInstanceById(id));
	}

	// =========================
	// GET ALL
	// =========================
	@GetMapping("/list")
	public ResponseEntity<?> getFlightInstances() {

		return ResponseUtil.ok(flightInstanceService.getFlightInstances());
	}

	// =========================
	// FILTER
	// =========================
	@GetMapping
	public ResponseEntity<?> getByAirlineId(@RequestHeader("X-User-Id") Long userId,
			@RequestParam(required = false) Long departureAirportId,
			@RequestParam(required = false) Long arrivalAirportId, @RequestParam(required = false) Long flightId,
			@RequestParam(required = false) LocalDate onDate, Pageable pageable) {

		return ResponseUtil.ok(flightInstanceService.getByAirlineId(userId, departureAirportId, arrivalAirportId,
				flightId, onDate, pageable));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id:\\d+}")
	public ResponseEntity<?> updateFlightInstance(@PathVariable Long id,
			@Valid @RequestBody FlightInstanceRequest request) {

		return ResponseUtil.ok(flightInstanceService.updateFlightInstance(id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id:\\d+}")
	public ResponseEntity<?> deleteFlightInstance(@PathVariable Long id) {

		flightInstanceService.deleteFlightInstance(id);

		return ResponseUtil.noContent();
	}
}