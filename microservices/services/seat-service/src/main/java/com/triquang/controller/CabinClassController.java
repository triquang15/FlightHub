package com.triquang.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.enums.CabinClassType;
import com.triquang.payload.request.CabinClassRequest;
import com.triquang.service.CabinClassService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/cabin-classes")
@RequiredArgsConstructor
public class CabinClassController {

	private final CabinClassService cabinClassService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	public ResponseEntity<?> createCabinClass(@Valid @RequestBody CabinClassRequest request) {

		return ResponseUtil.created(cabinClassService.createCabinClass(request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	public ResponseEntity<?> createCabinClasses(@Valid @RequestBody List<CabinClassRequest> requests) {

		return ResponseUtil.created(cabinClassService.createCabinClasses(requests));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id}")
	public ResponseEntity<?> getCabinClassById(@PathVariable Long id) {

		return ResponseUtil.ok(cabinClassService.getCabinClassById(id));
	}

	// =========================
	// GET BY AIRCRAFT + NAME
	// =========================
	@GetMapping("/aircraft/{aircraftId}/name/{cabinClass}")
	public ResponseEntity<?> getCabinClassByAircraftIdAndName(@PathVariable Long aircraftId,
			@PathVariable CabinClassType cabinClass) {

		return ResponseUtil.ok(cabinClassService.getByAircraftIdAndName(aircraftId, cabinClass));
	}

	// =========================
	// GET BY AIRCRAFT
	// =========================
	@GetMapping("/aircraft/{aircraftId}")
	public ResponseEntity<?> getCabinClassesByAircraftId(@PathVariable Long aircraftId) {

		return ResponseUtil.ok(cabinClassService.getCabinClassesByAircraftId(aircraftId));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id}")
	public ResponseEntity<?> updateCabinClass(@PathVariable Long id, @Valid @RequestBody CabinClassRequest request) {

		return ResponseUtil.ok(cabinClassService.updateCabinClass(id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id}")
	public ResponseEntity<?> deleteCabinClass(@PathVariable Long id) {

		cabinClassService.deleteCabinClass(id);

		return ResponseUtil.noContent();
	}
}