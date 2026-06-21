package com.triquang.service;

import java.util.List;

import com.triquang.enums.BookingStatus;
import com.triquang.payload.request.BookingRequest;
import com.triquang.payload.response.BookingResponse;
import com.triquang.payload.response.BookingStatisticsResponse;
import com.triquang.payload.response.PaymentInitiateResponse;

public interface BookingService {

	PaymentInitiateResponse createBooking(BookingRequest request, Long userId);

	BookingResponse updateBooking(Long id, BookingRequest request, Long userId);

	BookingResponse getBookingById(Long id, Long userId);

	List<BookingResponse> getBookingsByAirline(Long userId, String searchQuery, BookingStatus status,
			Long flightInstanceId, String sortDirection);

	List<BookingResponse> getBookingsByUser(Long userId);

	BookingResponse cancelBooking(Long id, Long userId);

	void deleteBooking(Long id, Long userId);

	boolean existsById(Long id);

	long count();

	long countByFlightId(Long flightId);

	BookingStatisticsResponse getBookingStatisticsForAirline(Long userId);
}
