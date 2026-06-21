package com.triquang.client;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.triquang.enums.ErrorCode;
import com.triquang.payload.PaymentDTO;
import com.triquang.payload.request.PaymentInitiateRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.PaymentInitiateResponse;

@Component
public class PaymentClientFallback implements PaymentClient {

    @Override
	public ApiResponse<PaymentInitiateResponse> initiatePaymentResponse(PaymentInitiateRequest request, Long userId) {
        return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "payment-service-fallback");
	}

	@Override
	public ApiResponse<PaymentDTO> cancelPaymentResponse(Long bookingId, Long userId) {
		return ApiResponse.error(ErrorCode.PAYMENT_SERVICE_DOWN, "payment-service-fallback");
	}

    @Override
    public ApiResponse<PaymentDTO> getPaymentByBookingIdResponse(Long bookingId) {
        return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "payment-service-fallback");
    }

    @Override
    public ApiResponse<Map<Long, PaymentDTO>> getPaymentsByBookingIdsResponse(List<Long> bookingIds) {
        return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "payment-service-fallback");
    }
}
