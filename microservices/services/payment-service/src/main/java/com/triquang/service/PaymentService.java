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

	PaymentDTO verifyPayment(PaymentVerifyRequest request);

	Page<PaymentDTO> getAllPayments(Pageable pageable);

	Map<Long, PaymentDTO> getPaymentsByBookingIds(List<Long> bookingIds);
}
