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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/insurance-coverages")
@RequiredArgsConstructor
@Tag(name = "Insurance Coverages", description = "Manage coverage tiers attached to airline insurance ancillary products.")
public class InsuranceCoverageController {

	private final InsuranceCoverageService coverageService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	@Operation(summary = "Create insurance coverage", description = "Creates a coverage tier for an insurance ancillary owned by the authenticated airline.")
	@ApiResponses({
			@ApiResponse(responseCode = "201", description = "Coverage created"),
			@ApiResponse(responseCode = "400", description = "Invalid coverage payload"),
			@ApiResponse(responseCode = "403", description = "Ancillary is not owned by the authenticated airline"),
			@ApiResponse(responseCode = "404", description = "Ancillary not found")
	})
	public ResponseEntity<?> createCoverage(@Valid @RequestBody InsuranceCoverageRequest request,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.created(coverageService.createCoverage(userId, request));
	}

	// =========================
	// BULK CREATE
	// =========================
	@PostMapping("/bulk")
	@Operation(summary = "Bulk create insurance coverages", description = "Creates multiple coverage tiers after validating each referenced insurance ancillary belongs to the authenticated airline.")
	@ApiResponses({
			@ApiResponse(responseCode = "201", description = "Coverages created"),
			@ApiResponse(responseCode = "400", description = "One or more coverage payloads are invalid"),
			@ApiResponse(responseCode = "403", description = "One or more referenced ancillaries are not owned by the airline")
	})
	public ResponseEntity<?> createCoveragesBulk(@Valid @RequestBody List<InsuranceCoverageRequest> requests,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.created(coverageService.createCoveragesBulk(userId, requests));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id:\\d+}")
	@Operation(summary = "Update insurance coverage", description = "Updates coverage terms for an owned insurance product without changing the linked ancillary.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Coverage updated"),
			@ApiResponse(responseCode = "400", description = "Invalid coverage payload"),
			@ApiResponse(responseCode = "403", description = "Coverage belongs to another airline"),
			@ApiResponse(responseCode = "404", description = "Coverage not found")
	})
	public ResponseEntity<?> updateCoverage(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
			@Valid @RequestBody InsuranceCoverageRequest request) {

		return ResponseUtil.ok(coverageService.updateCoverage(userId, id, request));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id:\\d+}")
	@Operation(summary = "Delete insurance coverage", description = "Deletes an owned coverage tier from the insurance ancillary catalog.")
	@ApiResponses({
			@ApiResponse(responseCode = "204", description = "Coverage deleted"),
			@ApiResponse(responseCode = "403", description = "Coverage belongs to another airline"),
			@ApiResponse(responseCode = "404", description = "Coverage not found")
	})
	public ResponseEntity<?> deleteCoverage(@PathVariable Long id,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		coverageService.deleteCoverage(userId, id);

		return ResponseUtil.noContent();
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id:\\d+}")
	@Operation(summary = "Get owned insurance coverage", description = "Returns one coverage tier when it belongs to the authenticated airline owner.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Coverage returned"),
			@ApiResponse(responseCode = "403", description = "Coverage belongs to another airline"),
			@ApiResponse(responseCode = "404", description = "Coverage not found")
	})
	public ResponseEntity<?> getCoverageById(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@PathVariable Long id) {

		return ResponseUtil.ok(coverageService.getCoverageById(userId, id));
	}

	// =========================
	// GET ALL
	// =========================
	@GetMapping
	@Operation(summary = "List owned insurance coverages", description = "Returns all insurance coverage tiers for the authenticated airline owner.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Coverage list returned")
	})
	public ResponseEntity<?> getAllCoverages(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(coverageService.getAllCoverages(userId));
	}

	// =========================
	// GET BY ANCILLARY
	// =========================
	@GetMapping("/ancillary/{ancillaryId:\\d+}")
	@Operation(summary = "List coverages by owned ancillary", description = "Returns coverage tiers attached to an insurance ancillary owned by the authenticated airline.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Coverage list returned"),
			@ApiResponse(responseCode = "403", description = "Ancillary belongs to another airline"),
			@ApiResponse(responseCode = "404", description = "Ancillary not found")
	})
	public ResponseEntity<?> getCoveragesByAncillaryId(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@PathVariable Long ancillaryId) {

		return ResponseUtil.ok(coverageService.getCoveragesByAncillaryId(userId, ancillaryId));
	}

	// =========================
	// GET ACTIVE
	// =========================
	@GetMapping("/ancillary/{ancillaryId:\\d+}/active")
	@Operation(summary = "List active coverages by ancillary", description = "Public read endpoint used by shopping flows to display active coverage tiers for an insurance ancillary.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Active coverages returned")
	})
	public ResponseEntity<?> getActiveCoveragesByAncillaryId(@PathVariable Long ancillaryId) {

		return ResponseUtil.ok(coverageService.getActiveCoveragesByAncillaryId(ancillaryId));
	}
}
