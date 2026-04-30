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

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/passengers")
@RequiredArgsConstructor
public class PassengerController {

	private final PassengerService passengerService;

	// =========================
	// CREATE PASSENGER
	// =========================
	@PostMapping
	public ResponseEntity<?> createPassenger(@Valid @RequestBody PassengerRequest request,
			@RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.created(passengerService.createPassenger(request, userId));
	}

	// =========================
	// FIND EXISTING PASSENGER
	// =========================
	@PostMapping("/find")
	public ResponseEntity<?> findExistingPassenger(@RequestBody PassengerRequest request) {

		return ResponseUtil.ok(passengerService.findExistingPassenger(request));
	}

	// =========================
	// CHECK EXISTS
	// =========================
	@GetMapping("/{id}/exists")
	public ResponseEntity<?> existsById(@PathVariable Long id) {

		return ResponseUtil.ok(passengerService.existsById(id));
	}

	// =========================
	// COUNT
	// =========================
	@GetMapping("/count")
	public ResponseEntity<?> countPassengers() {

		return ResponseUtil.ok(passengerService.count());
	}
}