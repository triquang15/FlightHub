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

import com.triquang.payload.request.InsuranceCoverageRequest;
import com.triquang.service.InsuranceCoverageService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/insurance-coverages")
@RequiredArgsConstructor
public class InsuranceCoverageController {

	private final InsuranceCoverageService coverageService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	public ResponseEntity<?> createCoverage(@Valid @RequestBody InsuranceCoverageRequest request,
			@RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.created(coverageService.createCoverage(request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	public ResponseEntity<?> createCoveragesBulk(@Valid @RequestBody List<InsuranceCoverageRequest> requests,
			@RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.created(coverageService.createCoveragesBulk(requests));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id:\\d+}")
	public ResponseEntity<?> updateCoverage(@PathVariable Long id,
			@Valid @RequestBody InsuranceCoverageRequest request) {

		return ResponseUtil.ok(coverageService.updateCoverage(id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id:\\d+}")
	public ResponseEntity<?> deleteCoverage(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {

		coverageService.deleteCoverage(id);

		return ResponseUtil.noContent();
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id:\\d+}")
	public ResponseEntity<?> getCoverageById(@PathVariable Long id) {

		return ResponseUtil.ok(coverageService.getCoverageById(id));
	}

	// =========================
	// GET ALL
	// =========================
	@GetMapping
	public ResponseEntity<?> getAllCoverages() {

		return ResponseUtil.ok(coverageService.getAllCoverages());
	}

	// =========================
	// GET BY ANCILLARY
	// =========================
	@GetMapping("/ancillary/{ancillaryId:\\d+}")
	public ResponseEntity<?> getCoveragesByAncillaryId(@PathVariable Long ancillaryId) {

		return ResponseUtil.ok(coverageService.getCoveragesByAncillaryId(ancillaryId));
	}

	// =========================
	// GET ACTIVE
	// =========================
	@GetMapping("/ancillary/{ancillaryId:\\d+}/active")
	public ResponseEntity<?> getActiveCoveragesByAncillaryId(@PathVariable Long ancillaryId) {

		return ResponseUtil.ok(coverageService.getActiveCoveragesByAncillaryId(ancillaryId));
	}
}