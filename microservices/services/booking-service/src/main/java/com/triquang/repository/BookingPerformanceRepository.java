package com.triquang.repository;

import java.time.LocalDateTime;
import java.util.List;

import com.triquang.model.Booking;

public interface BookingPerformanceRepository {

	// Booking Statistics
	Long countBookingsByFlightIdAndDateRange(Long flightId, LocalDateTime startDate, LocalDateTime endDate);

	Double sumRevenueByFlightIdAndDateRange(Long flightId, LocalDateTime startDate, LocalDateTime endDate);

	List<Booking> findBookingsByFlightIdAndDateRange(Long flightId, LocalDateTime startDate, LocalDateTime endDate);
}
