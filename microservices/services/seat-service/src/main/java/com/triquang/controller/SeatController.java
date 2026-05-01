package com.triquang.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.payload.request.SeatRequest;
import com.triquang.service.SeatService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/seats")
@RequiredArgsConstructor
public class SeatController {

	private final SeatService seatService;

	// =========================
	// GET ALL
	// =========================
	@GetMapping
	public ResponseEntity<?> getAllSeats() {

		return ResponseUtil.ok(seatService.getAll());
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id}")
	public ResponseEntity<?> getSeatById(@PathVariable Long id) {

		return ResponseUtil.ok(seatService.getSeatById(id));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id}")
	public ResponseEntity<?> updateSeat(@PathVariable Long id, @Valid @RequestBody SeatRequest request) {

		return ResponseUtil.ok(seatService.updateSeat(id, request));
	}
}