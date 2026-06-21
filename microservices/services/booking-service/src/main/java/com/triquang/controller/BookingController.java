package com.triquang.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.enums.BookingStatus;
import com.triquang.payload.request.BookingRequest;
import com.triquang.service.BookingService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/bookings")
@Tag(name = "Bookings", description = "Manage bookings, booking lifecycle, ticket creation, and passenger lookup.")
@RequiredArgsConstructor
public class BookingController {

	private final BookingService bookingService;

	// =========================
	// CREATE BOOKING (PAYMENT INIT)
	// =========================
	@Operation(summary = "Create booking", description = "Creates a new booking and initiates payment for the requested flight, seats, and ancillaries.")
	@ApiResponses({
		@ApiResponse(responseCode = "201", description = "Booking created and payment initiated"),
		@ApiResponse(responseCode = "400", description = "Invalid booking request"),
		@ApiResponse(responseCode = "401", description = "Authentication required"),
		@ApiResponse(responseCode = "502", description = "External service unavailable")
	})
	@PostMapping
	public ResponseEntity<?> createBooking(@Valid @RequestBody BookingRequest request,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.created(bookingService.createBooking(request, userId));
	}

	// =========================
	// UPDATE
	// =========================
	@Operation(summary = "Update booking", description = "Updates an existing booking with new passenger, fare, or seat selections.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Booking updated successfully"),
		@ApiResponse(responseCode = "400", description = "Invalid booking update request"),
		@ApiResponse(responseCode = "404", description = "Booking not found")
	})
	@PutMapping("/{id:\\d+}")
	public ResponseEntity<?> updateBooking(@PathVariable Long id, @Valid @RequestBody BookingRequest request,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(bookingService.updateBooking(id, request, userId));
	}

	// =========================
	// GET BY ID
	// =========================
	@Operation(summary = "Get booking by ID", description = "Returns booking details, ticket list, and pricing information for a specified booking.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Booking found"),
		@ApiResponse(responseCode = "404", description = "Booking not found")
	})
	@GetMapping("/{id:\\d+}")
	public ResponseEntity<?> getBookingById(@PathVariable Long id,
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(bookingService.getBookingById(id, userId));
	}

	// =========================
	// GET BOOKINGS BY AIRLINE (SEARCH + FILTER)
	// =========================
	@Operation(summary = "Search bookings by airline", description = "Returns bookings for an airline owner, with optional filters for status, flight instance, and keywords.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Bookings returned"),
		@ApiResponse(responseCode = "401", description = "Authentication required")
	})
	@GetMapping("/airline")
	public ResponseEntity<?> getBookingsByAirline(@RequestParam(required = false) String search,
			@RequestParam(required = false) BookingStatus status, @RequestParam(required = false) Long flightInstanceId,
			@RequestParam(defaultValue = "DESC") String sortDirection, @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil
				.ok(bookingService.getBookingsByAirline(userId, search, status, flightInstanceId, sortDirection));
	}

	// =========================
	// USER HISTORY
	// =========================
	@Operation(summary = "Get user booking history", description = "Returns the authenticated user's booking history.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Booking history returned"),
		@ApiResponse(responseCode = "401", description = "Authentication required")
	})
	@GetMapping("/user/history")
	public ResponseEntity<?> getBookingsByUser(@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(bookingService.getBookingsByUser(userId));
	}

	// =========================
	// CANCEL BOOKING
	// =========================
	@Operation(summary = "Cancel booking", description = "Cancels an existing booking and updates its status.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Booking canceled successfully"),
		@ApiResponse(responseCode = "404", description = "Booking not found")
	})
	@PatchMapping("/{id}/cancel")
	public ResponseEntity<?> cancelBooking(@PathVariable Long id, @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(bookingService.cancelBooking(id, userId));
	}

	// =========================
	// DELETE
	// =========================
	@Operation(summary = "Delete booking", description = "Deletes a booking and its related records from the system.")
	@ApiResponses({
		@ApiResponse(responseCode = "204", description = "Booking deleted successfully"),
		@ApiResponse(responseCode = "404", description = "Booking not found")
	})
	@DeleteMapping("/{id:\\d+}")
	public ResponseEntity<?> deleteBooking(@PathVariable Long id, @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		bookingService.deleteBooking(id, userId);

		return ResponseUtil.noContent();
	}

	// =========================
	// COUNT BY FLIGHT
	// =========================
	@Operation(summary = "Count bookings by flight", description = "Returns the number of bookings associated with a specific flight instance.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Booking count returned"),
		@ApiResponse(responseCode = "400", description = "Invalid flight ID")
	})
	@GetMapping("/count/flight/{flightId}")
	public ResponseEntity<?> getBookingCountByFlight(@PathVariable Long flightId) {

		return ResponseUtil.ok(bookingService.countByFlightId(flightId));
	}

	// =========================
	// STATISTICS
	// =========================
	@Operation(summary = "Booking statistics for airline", description = "Returns daily and monthly booking statistics for a specific airline.")
	@ApiResponses({
		@ApiResponse(responseCode = "200", description = "Statistics returned"),
		@ApiResponse(responseCode = "400", description = "Invalid airline ID")
	})
	@GetMapping("/statistics/airline")
	public ResponseEntity<?> getBookingStatisticsForAirline(
			@Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(bookingService.getBookingStatisticsForAirline(userId));
	}
}
