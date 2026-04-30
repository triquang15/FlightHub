package com.triquang.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.triquang.payload.request.AncillaryRequest;
import com.triquang.payload.response.AncillaryResponse;
import com.triquang.service.AncillaryService;
import com.triquang.utils.ResponseUtil;

import java.util.List;

/**
 * AncillaryController handles CRUD operations for ancillary services offered by airlines.
 * It allows airline staff to create, retrieve, update, and delete ancillary services.
 * 
 * @author Tri Quang
 * @version 1.0
 */

@RestController
@RequestMapping("/api/ancillaries")
@RequiredArgsConstructor
public class AncillaryController {

	private final AncillaryService ancillaryService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	public ResponseEntity<?> create(@Valid @RequestBody AncillaryRequest request,
			@RequestHeader("X-User-Id") Long userId) {

		AncillaryResponse response = ancillaryService.create(userId, request);

		return ResponseUtil.created(response);
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id}")
	public ResponseEntity<?> getById(@PathVariable Long id) {

		AncillaryResponse response = ancillaryService.getById(id);

		return ResponseUtil.ok(response);
	}

	// =========================
	// GET ALL BY AIRLINE
	// =========================
	@GetMapping
	public ResponseEntity<?> getAllByAirlineId(@RequestHeader("X-User-Id") Long userId) {

		List<AncillaryResponse> response = ancillaryService.getAllByAirlineId(userId);

		return ResponseUtil.ok(response);
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id}")
	public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody AncillaryRequest request) {

		AncillaryResponse response = ancillaryService.update(id, request);

		return ResponseUtil.ok(response);
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id}")
	public ResponseEntity<?> delete(@PathVariable Long id) {

		ancillaryService.delete(id);

		return ResponseUtil.noContent();
	}
}