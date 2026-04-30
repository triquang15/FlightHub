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

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

	private final BookingService bookingService;

	// =========================
	// CREATE BOOKING (PAYMENT INIT)
	// =========================
	@PostMapping
	public ResponseEntity<?> createBooking(@Valid @RequestBody BookingRequest request,
			@RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.created(bookingService.createBooking(request, userId));
	}

	// =========================
	// UPDATE
	// =========================
	@PutMapping("/{id:\\d+}")
	public ResponseEntity<?> updateBooking(@PathVariable Long id, @Valid @RequestBody BookingRequest request,
			@RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(bookingService.updateBooking(id, request));
	}

	// =========================
	// GET BY ID
	// =========================
	@GetMapping("/{id:\\d+}")
	public ResponseEntity<?> getBookingById(@PathVariable Long id) {

		return ResponseUtil.ok(bookingService.getBookingById(id));
	}

	// =========================
	// GET BOOKINGS BY AIRLINE (SEARCH + FILTER)
	// =========================
	@GetMapping("/airline")
	public ResponseEntity<?> getBookingsByAirline(@RequestParam(required = false) String search,
			@RequestParam(required = false) BookingStatus status, @RequestParam(required = false) Long flightInstanceId,
			@RequestParam(defaultValue = "DESC") String sortDirection, @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil
				.ok(bookingService.getBookingsByAirline(userId, search, status, flightInstanceId, sortDirection));
	}

	// =========================
	// USER HISTORY
	// =========================
	@GetMapping("/user/history")
	public ResponseEntity<?> getBookingsByUser(@RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(bookingService.getBookingsByUser(userId));
	}

	// =========================
	// CANCEL BOOKING
	// =========================
	@PatchMapping("/{id}/cancel")
	public ResponseEntity<?> cancelBooking(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {

		return ResponseUtil.ok(bookingService.cancelBooking(id));
	}

	// =========================
	// DELETE
	// =========================
	@DeleteMapping("/{id:\\d+}")
	public ResponseEntity<?> deleteBooking(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {

		bookingService.deleteBooking(id);

		return ResponseUtil.noContent();
	}

	// =========================
	// COUNT BY FLIGHT
	// =========================
	@GetMapping("/count/flight/{flightId}")
	public ResponseEntity<?> getBookingCountByFlight(@PathVariable Long flightId) {

		return ResponseUtil.ok(bookingService.countByFlightId(flightId));
	}

	// =========================
	// STATISTICS
	// =========================
	@GetMapping("/statistics/airline")
	public ResponseEntity<?> getBookingStatisticsForAirline(@RequestParam Long airlineId) {

		return ResponseUtil.ok(bookingService.getBookingStatisticsForAirline(airlineId));
	}
}