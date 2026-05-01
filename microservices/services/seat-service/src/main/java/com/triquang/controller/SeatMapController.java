package com.triquang.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.payload.request.SeatMapRequest;
import com.triquang.service.SeatMapService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/seat-maps")
@RequiredArgsConstructor
public class SeatMapController {

	private final SeatMapService seatMapService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	public ResponseEntity<?> createSeatMap(@RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody SeatMapRequest request) {

		return ResponseUtil.created(seatMapService.createSeatMap(userId, request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	public ResponseEntity<?> createSeatMaps(@RequestHeader("X-User-Id") Long userId,
			@Valid @RequestBody List<SeatMapRequest> requests) {

		return ResponseUtil.created(seatMapService.createSeatMaps(userId, requests));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id}")
	public ResponseEntity<?> getSeatMapById(@PathVariable Long id) {

		return ResponseUtil.ok(seatMapService.getSeatMapById(id));
	}

	// =========================
	// GET BY CABIN CLASS
	// =========================
	@GetMapping("/cabin-class/{cabinClassId}")
	public ResponseEntity<?> getSeatMapsByCabinClass(@PathVariable Long cabinClassId) {

		return ResponseUtil.ok(seatMapService.getSeatMapsByCabinClass(cabinClassId));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id}")
	public ResponseEntity<?> updateSeatMap(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
			@Valid @RequestBody SeatMapRequest request) {

		return ResponseUtil.ok(seatMapService.updateSeatMap(userId, id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteSeatMap(@PathVariable Long id) {

		seatMapService.deleteSeatMap(id);

		return ResponseUtil.noContent();
	}
}