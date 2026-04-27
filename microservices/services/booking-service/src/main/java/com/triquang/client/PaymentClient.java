package com.triquang.client;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import com.triquang.payload.PaymentDTO;
import com.triquang.payload.request.PaymentInitiateRequest;
import com.triquang.payload.response.PaymentInitiateResponse;

import jakarta.validation.Valid;

@FeignClient(name = "payment-service", fallback = PaymentClientFallback.class)
public interface PaymentClient {

	@PostMapping("/api/payments/initiate")
	PaymentInitiateResponse initiatePayment(@Valid @RequestBody PaymentInitiateRequest request,
			@RequestHeader("X-User-Id") Long userId);

	@GetMapping("/api/payments/booking/{bookingId}")
	PaymentDTO getPaymentByBookingId(@PathVariable Long bookingId);

	@PostMapping("/api/payments/batch/bookings")
	Map<Long, PaymentDTO> getPaymentsByBookingIds(@RequestBody List<Long> bookingIds);
}
