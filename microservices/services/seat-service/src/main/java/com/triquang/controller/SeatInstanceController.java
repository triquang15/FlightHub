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
import com.triquang.payload.request.SeatConfirmRequest;
import com.triquang.payload.request.SeatHoldRequest;
import com.triquang.payload.request.SeatInstanceRequest;
import com.triquang.payload.request.SeatReleaseRequest;
import com.triquang.service.SeatInstanceService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/seat-instances")
@Tag(name = "Seat Instances", description = "Manage per-flight-instance seat availability, hold, release, and booking confirmation lifecycle.")
@RequiredArgsConstructor
public class SeatInstanceController {

	private final SeatInstanceService seatInstanceService;

	// =========================
	// CREATE
	// =========================
	@Operation(summary = "Create seat instance")
	@PostMapping
	public ResponseEntity<?> createSeatInstance(@Valid @RequestBody SeatInstanceRequest request) {

		return ResponseUtil.created(seatInstanceService.createSeatInstance(request));
	}

	// =========================
	// GET BY ID
	// =========================
	@Operation(summary = "Get seat instance by ID")
	@GetMapping("/{id}")
	public ResponseEntity<?> getSeatInstanceById(@PathVariable Long id) {

		return ResponseUtil.ok(seatInstanceService.getSeatInstanceById(id));
	}

	// =========================
	// CALCULATE PRICE
	// =========================
	@Operation(summary = "Calculate total selected seat price")
	@PostMapping("/price/total")
	public ResponseEntity<?> calculateSeatPrice(@RequestBody List<Long> seatInstanceIds) {

		return ResponseUtil.ok(seatInstanceService.calculateSeatPrice(seatInstanceIds));
	}

	// =========================
	// GET BY FLIGHT
	// =========================
	@Operation(summary = "List seat instances by legacy flight ID", description = "Compatibility endpoint. New clients should prefer flightInstanceId.")
	@GetMapping("/flight/{flightId}")
	public ResponseEntity<?> getSeatInstancesByFlightId(@PathVariable Long flightId) {

		return ResponseUtil.ok(seatInstanceService.getSeatInstancesByFlightId(flightId));
	}

	@Operation(summary = "List seat instances by flight instance")
	@GetMapping("/flight-instance/{flightInstanceId}")
	public ResponseEntity<?> getSeatInstancesByFlightInstanceId(@PathVariable Long flightInstanceId) {

		return ResponseUtil.ok(seatInstanceService.getSeatInstancesByFlightInstanceId(flightInstanceId));
	}

	// =========================
	// GET BY IDS
	// =========================
	@Operation(summary = "Get seat instances by IDs")
	@GetMapping("/all")
	public ResponseEntity<?> getAllByIds(@RequestParam List<Long> ids) { // fix Ids → ids

		return ResponseUtil.ok(seatInstanceService.getAllByIds(ids));
	}

	// =========================
	// AVAILABLE SEATS
	// =========================
	@Operation(summary = "List available seats by legacy flight ID", description = "Compatibility endpoint. New clients should prefer flightInstanceId.")
	@GetMapping("/flight/{flightId}/available")
	public ResponseEntity<?> getAvailableSeatsByFlightId(@PathVariable Long flightId) {

		return ResponseUtil.ok(seatInstanceService.getAvailableSeatsByFlightId(flightId));
	}

	@Operation(summary = "List available seats by flight instance")
	@GetMapping("/flight-instance/{flightInstanceId}/available")
	public ResponseEntity<?> getAvailableSeatsByFlightInstanceId(@PathVariable Long flightInstanceId) {

		return ResponseUtil.ok(seatInstanceService.getAvailableSeatsByFlightInstanceId(flightInstanceId));
	}

	// =========================
	// COUNT AVAILABLE
	// =========================
	@Operation(summary = "Count available seats by legacy flight ID", description = "Compatibility endpoint. New clients should prefer flightInstanceId.")
	@GetMapping("/flight/{flightId}/available/count")
	public ResponseEntity<?> countAvailableByFlightId(@PathVariable Long flightId) {

		return ResponseUtil.ok(seatInstanceService.countAvailableByFlightId(flightId));
	}

	@Operation(summary = "Count available seats by flight instance")
	@GetMapping("/flight-instance/{flightInstanceId}/available/count")
	public ResponseEntity<?> countAvailableByFlightInstanceId(@PathVariable Long flightInstanceId) {

		return ResponseUtil.ok(seatInstanceService.countAvailableByFlightInstanceId(flightInstanceId));
	}

	@Operation(summary = "Hold selected seats", description = "Moves AVAILABLE seats to HELD and returns a hold token plus expiration time for checkout.")
	@PostMapping("/hold")
	public ResponseEntity<?> holdSeats(@Valid @RequestBody SeatHoldRequest request) {

		return ResponseUtil.ok(seatInstanceService.holdSeats(request));
	}

	@Operation(summary = "Release held seats", description = "Returns HELD seats to AVAILABLE when the hold token matches.")
	@PostMapping("/release")
	public ResponseEntity<?> releaseSeats(@Valid @RequestBody SeatReleaseRequest request) {

		return ResponseUtil.ok(seatInstanceService.releaseSeats(request));
	}

	@Operation(summary = "Confirm held seats", description = "Moves selected seats to BOOKED and stores the booking reference.")
	@PostMapping("/confirm")
	public ResponseEntity<?> confirmSeats(@Valid @RequestBody SeatConfirmRequest request) {

		return ResponseUtil.ok(seatInstanceService.confirmSeats(request));
	}

	// =========================
	// UPDATE STATUS
	// =========================
	@Operation(summary = "Update seat instance status")
	@PatchMapping("/{id}/status")
	public ResponseEntity<?> updateSeatInstanceStatus(@PathVariable Long id,
			@RequestParam SeatAvailabilityStatus status) {

		return ResponseUtil.ok(seatInstanceService.updateSeatInstanceStatus(id, status));
	}
}
