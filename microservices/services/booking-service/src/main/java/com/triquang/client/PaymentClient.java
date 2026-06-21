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
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.PaymentInitiateResponse;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;

import jakarta.validation.Valid;

@FeignClient(name = "payment-service", fallback = PaymentClientFallback.class)
public interface PaymentClient {

	@PostMapping("/api/payments/initiate")
	ApiResponse<PaymentInitiateResponse> initiatePaymentResponse(@Valid @RequestBody PaymentInitiateRequest request,
			@RequestHeader("X-User-Id") Long userId);

	default PaymentInitiateResponse initiatePayment(PaymentInitiateRequest request, Long userId) {
		return requireData(initiatePaymentResponse(request, userId));
	}

	@PostMapping("/api/payments/booking/{bookingId}/cancel")
	ApiResponse<PaymentDTO> cancelPaymentResponse(@PathVariable Long bookingId,
			@RequestHeader("X-User-Id") Long userId);

	default PaymentDTO cancelPayment(Long bookingId, Long userId) {
		return requireData(cancelPaymentResponse(bookingId, userId));
	}

	@GetMapping("/api/payments/booking/{bookingId}")
	ApiResponse<PaymentDTO> getPaymentByBookingIdResponse(@PathVariable Long bookingId);

	default PaymentDTO getPaymentByBookingId(Long bookingId) {
		return requireData(getPaymentByBookingIdResponse(bookingId));
	}

	@PostMapping("/api/payments/batch/bookings")
	ApiResponse<Map<Long, PaymentDTO>> getPaymentsByBookingIdsResponse(@RequestBody List<Long> bookingIds);

	default Map<Long, PaymentDTO> getPaymentsByBookingIds(List<Long> bookingIds) {
		return requireData(getPaymentsByBookingIdsResponse(bookingIds));
	}

	private static <T> T requireData(ApiResponse<T> response) {
		if (response == null || response.data() == null || response.errorCode() != null) {
			throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
		}
		return response.data();
	}
}
