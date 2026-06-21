package com.triquang.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.triquang.payload.request.AncillaryRequest;
import com.triquang.payload.response.AncillaryResponse;
import com.triquang.service.AncillaryService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Ancillary Catalog", description = "Manage airline-owned ancillary catalog items such as baggage, seats, lounge access, and insurance products.")
public class AncillaryController {

	private final AncillaryService ancillaryService;

	// =========================
	// CREATE
	// =========================
	@PostMapping
	@Operation(summary = "Create ancillary catalog item", description = "Creates a reusable airline-owned ancillary product. The airline is resolved from the trusted X-User-Id header injected by the gateway.")
	@ApiResponses({
			@ApiResponse(responseCode = "201", description = "Ancillary created"),
			@ApiResponse(responseCode = "400", description = "Invalid ancillary payload"),
			@ApiResponse(responseCode = "403", description = "Authenticated user does not own an airline")
	})
	public ResponseEntity<?> create(@Valid @RequestBody AncillaryRequest request,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		AncillaryResponse response = ancillaryService.create(userId, request);

		return ResponseUtil.created(response);
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id}")
	@Operation(summary = "Get owned ancillary", description = "Returns one ancillary catalog item when it belongs to the authenticated airline owner.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Ancillary returned"),
			@ApiResponse(responseCode = "403", description = "Ancillary belongs to another airline"),
			@ApiResponse(responseCode = "404", description = "Ancillary not found")
	})
	public ResponseEntity<?> getById(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId,
			@PathVariable Long id) {

		AncillaryResponse response = ancillaryService.getById(userId, id);

		return ResponseUtil.ok(response);
	}

	// =========================
	// GET ALL BY AIRLINE
	// =========================
	@GetMapping
	@Operation(summary = "List owned ancillary catalog", description = "Returns all ancillary catalog items for the authenticated airline owner.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Ancillary list returned"),
			@ApiResponse(responseCode = "403", description = "Authenticated user does not own an airline")
	})
	public ResponseEntity<?> getAllByAirlineId(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		List<AncillaryResponse> response = ancillaryService.getAllByAirlineId(userId);

		return ResponseUtil.ok(response);
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id}")
	@Operation(summary = "Update ancillary catalog item", description = "Updates mutable catalog details without changing ownership. Items already assigned to flights remain linked to the same catalog record.")
	@ApiResponses({
			@ApiResponse(responseCode = "200", description = "Ancillary updated"),
			@ApiResponse(responseCode = "400", description = "Invalid ancillary payload"),
			@ApiResponse(responseCode = "403", description = "Ancillary belongs to another airline"),
			@ApiResponse(responseCode = "404", description = "Ancillary not found")
	})
	public ResponseEntity<?> update(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id,
			@Valid @RequestBody AncillaryRequest request) {

		AncillaryResponse response = ancillaryService.update(userId, id, request);

		return ResponseUtil.ok(response);
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id}")
	@Operation(summary = "Delete ancillary catalog item", description = "Deletes an owned ancillary only when it is not assigned to an active flight cabin offer.")
	@ApiResponses({
			@ApiResponse(responseCode = "204", description = "Ancillary deleted"),
			@ApiResponse(responseCode = "400", description = "Ancillary is in use and cannot be deleted"),
			@ApiResponse(responseCode = "403", description = "Ancillary belongs to another airline"),
			@ApiResponse(responseCode = "404", description = "Ancillary not found")
	})
	public ResponseEntity<?> delete(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {

		ancillaryService.delete(userId, id);

		return ResponseUtil.noContent();
	}
}
