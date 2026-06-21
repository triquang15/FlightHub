package com.triquang.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.triquang.payload.PaymentDTO;
import com.triquang.payload.request.PaymentInitiateRequest;
import com.triquang.payload.request.PaymentVerifyRequest;
import com.triquang.payload.response.PaymentInitiateResponse;

import java.util.List;
import java.util.Map;

public interface PaymentService {

	PaymentInitiateResponse initiatePayment(PaymentInitiateRequest request);

	PaymentDTO verifyPayment(PaymentVerifyRequest request, Long userId);

	PaymentDTO cancelPaymentByBookingId(Long bookingId, Long userId);

	void processWebhook(com.triquang.service.gateway.ProviderWebhookEvent event);

	PaymentDTO refundPayment(Long paymentId, String roles);

	void reconcilePayment(Long paymentId);

	Page<PaymentDTO> getAllPayments(Pageable pageable);

	PaymentDTO getPaymentByBookingId(Long bookingId);

	Map<Long, PaymentDTO> getPaymentsByBookingIds(List<Long> bookingIds);
}
