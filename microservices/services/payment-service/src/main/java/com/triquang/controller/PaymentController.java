package com.triquang.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.payload.PaymentDTO;
import com.triquang.payload.request.PaymentInitiateRequest;
import com.triquang.payload.request.PaymentVerifyRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.PaymentInitiateResponse;
import com.triquang.service.PaymentService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PaymentController handles all payment-related API endpoints, including
 * initiating payments, verifying payment status, and fetching payment details.
 * It ensures that all responses are standardized and includes logging for better
 * traceability.
 *
 * @author Tri Quang
 */

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<PaymentInitiateResponse>> initiatePayment(
            @Valid @RequestBody PaymentInitiateRequest request,
            @RequestHeader("X-User-Id") Long userId) {

        log.info("INITIATE PAYMENT | userId={} | bookingId={}", userId, request.getBookingId());

        // đảm bảo userId từ header override request (tránh fake)
        request.setUserId(userId);

        PaymentInitiateResponse response = paymentService.initiatePayment(request);

        return ResponseUtil.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<PaymentDTO>> verifyPayment(
            @Valid @RequestBody PaymentVerifyRequest request) {

        log.info("VERIFY PAYMENT | paymentId={}", request.getPaymentId());

        PaymentDTO payment = paymentService.verifyPayment(request);

        return ResponseUtil.ok(payment);
    }

    @PostMapping("/batch/bookings")
    public ResponseEntity<ApiResponse<Map<Long, PaymentDTO>>> getPaymentsByBookingIds(
            @RequestBody List<Long> bookingIds) {

        log.info("BATCH PAYMENT FETCH | size={}", bookingIds.size());

        Map<Long, PaymentDTO> result =
                paymentService.getPaymentsByBookingIds(bookingIds);

        return ResponseUtil.ok(result);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PaymentDTO>>> getAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection,
            @RequestHeader("X-User-Id") Long userId) {

        log.info("GET ALL PAYMENTS | userId={} | page={} | size={}", userId, page, size);

        Sort.Direction direction = sortDirection.equalsIgnoreCase("ASC")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<PaymentDTO> payments = paymentService.getAllPayments(pageable);

        return ResponseUtil.ok(payments);
    }
}
