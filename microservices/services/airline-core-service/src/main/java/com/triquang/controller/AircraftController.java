package com.triquang.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.triquang.payload.request.AircraftRequest;
import com.triquang.payload.response.AircraftResponse;
import com.triquang.service.AircraftService;

import java.util.List;

@RestController
@RequestMapping("/api/aircrafts")
@RequiredArgsConstructor
public class AircraftController {

	private final AircraftService aircraftService;

	@PostMapping
	public ResponseEntity<AircraftResponse> createAircraft(@RequestBody AircraftRequest request,
			@RequestHeader("X-User-Id") Long userId) {
		return ResponseEntity.ok(aircraftService.createAircraft(request, userId));
	}

	@GetMapping("/{id}")
	public ResponseEntity<AircraftResponse> getAircraftById(@PathVariable Long id) {
		return ResponseEntity.ok(aircraftService.getAircraftById(id));
	}

	@GetMapping
	public ResponseEntity<List<AircraftResponse>> listAllAircrafts(@RequestHeader("X-User-Id") Long userId) {
		return ResponseEntity.ok(aircraftService.listAllAircraftsByOwner(userId));
	}

	@PutMapping("/{id}")
	public ResponseEntity<AircraftResponse> updateAircraft(@PathVariable Long id, @RequestBody AircraftRequest request,
			@RequestHeader("X-User-Id") Long userId) {
		return ResponseEntity.ok(aircraftService.updateAircraft(id, request, userId));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteAircraft(@PathVariable Long id) {
		aircraftService.deleteAircraft(id);
		return ResponseEntity.noContent().build();
	}
}
