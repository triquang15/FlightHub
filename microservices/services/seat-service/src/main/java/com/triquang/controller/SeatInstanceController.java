package com.triquang.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.enums.SeatAvailabilityStatus;
import com.triquang.payload.request.SeatInstanceRequest;
import com.triquang.service.SeatInstanceService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/seat-instances")
@RequiredArgsConstructor
public class SeatInstanceController {

	private final SeatInstanceService seatInstanceService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	public ResponseEntity<?> createSeatInstance(@Valid @RequestBody SeatInstanceRequest request) {

		return ResponseUtil.created(seatInstanceService.createSeatInstance(request));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id}")
	public ResponseEntity<?> getSeatInstanceById(@PathVariable Long id) {

		return ResponseUtil.ok(seatInstanceService.getSeatInstanceById(id));
	}

	// =========================
	// CALCULATE PRICE
	// =========================
	@PostMapping("/price/total")
	public ResponseEntity<?> calculateSeatPrice(@RequestBody List<Long> seatInstanceIds) {

		return ResponseUtil.ok(seatInstanceService.calculateSeatPrice(seatInstanceIds));
	}

	// =========================
	// GET BY FLIGHT
	// =========================
	@GetMapping("/flight/{flightId}")
	public ResponseEntity<?> getSeatInstancesByFlightId(@PathVariable Long flightId) {

		return ResponseUtil.ok(seatInstanceService.getSeatInstancesByFlightId(flightId));
	}

	// =========================
	// GET BY IDS
	// =========================
	@GetMapping("/all")
	public ResponseEntity<?> getAllByIds(@RequestParam List<Long> ids) { // fix Ids → ids

		return ResponseUtil.ok(seatInstanceService.getAllByIds(ids));
	}

	// =========================
	// AVAILABLE SEATS
	// =========================
	@GetMapping("/flight/{flightId}/available")
	public ResponseEntity<?> getAvailableSeatsByFlightId(@PathVariable Long flightId) {

		return ResponseUtil.ok(seatInstanceService.getAvailableSeatsByFlightId(flightId));
	}

	// =========================
	// COUNT AVAILABLE
	// =========================
	@GetMapping("/flight/{flightId}/available/count")
	public ResponseEntity<?> countAvailableByFlightId(@PathVariable Long flightId) {

		return ResponseUtil.ok(seatInstanceService.countAvailableByFlightId(flightId));
	}

	// =========================
	// UPDATE STATUS
	// =========================
	@PatchMapping("/{id}/status")
	public ResponseEntity<?> updateSeatInstanceStatus(@PathVariable Long id,
			@RequestParam SeatAvailabilityStatus status) {

		return ResponseUtil.ok(seatInstanceService.updateSeatInstanceStatus(id, status));
	}
}