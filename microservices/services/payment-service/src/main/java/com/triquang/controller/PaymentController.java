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
import org.springframework.web.bind.annotation.PathVariable;
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
import com.triquang.service.gateway.PaypalService;
import com.triquang.service.gateway.StripeService;
import com.triquang.utils.ResponseUtil;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Hidden;
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
@Tag(name = "Payments", description = "Initiate, verify, and inspect payment records for booking checkout.")
public class PaymentController {

    private final PaymentService paymentService;
    private final StripeService stripeService;
    private final PaypalService paypalService;

    @PostMapping("/initiate")
    @Operation(summary = "Initiate booking payment", description = "Creates or resumes a payment session for a booking. The trusted X-User-Id header overrides any userId in the request to prevent forged ownership.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Payment session initiated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid booking, amount, provider, or payment request"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentication required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "502", description = "Payment provider unavailable")
    })
    public ResponseEntity<ApiResponse<PaymentInitiateResponse>> initiatePayment(
            @Valid @RequestBody PaymentInitiateRequest request,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

        log.info("INITIATE PAYMENT | userId={} | bookingId={}", userId, request.getBookingId());

        // đảm bảo userId từ header override request (tránh fake)
        request.setUserId(userId);

        PaymentInitiateResponse response = paymentService.initiatePayment(request);

        return ResponseUtil.ok(response);
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify payment result", description = "Verifies a provider transaction and updates the local payment state used by Booking Service confirmation flows.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Payment verified"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid verification payload or provider state"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Payment not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "502", description = "Payment provider unavailable")
    })
    public ResponseEntity<ApiResponse<PaymentDTO>> verifyPayment(
            @Valid @RequestBody PaymentVerifyRequest request,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

        log.info("VERIFY PAYMENT | paymentId={}", request.getPaymentId());

        PaymentDTO payment = paymentService.verifyPayment(request, userId);

        return ResponseUtil.ok(payment);
    }

    @PostMapping("/booking/{bookingId}/cancel")
    @Operation(summary = "Cancel a pending booking payment", description = "Idempotently prevents a pending local payment from being verified after its booking is cancelled.")
    public ResponseEntity<ApiResponse<PaymentDTO>> cancelPayment(
            @PathVariable Long bookingId,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {
        return ResponseUtil.ok(paymentService.cancelPaymentByBookingId(bookingId, userId));
    }

    @PostMapping("/{paymentId}/refund")
    @Operation(summary = "Refund a completed payment", description = "System-admin operation that performs an idempotent full refund through the original provider.")
    public ResponseEntity<ApiResponse<PaymentDTO>> refundPayment(
            @PathVariable Long paymentId,
            @Parameter(hidden = true) @RequestHeader("X-User-Roles") String roles) {
        return ResponseUtil.ok(paymentService.refundPayment(paymentId, roles));
    }

    @Hidden
    @PostMapping("/webhooks/stripe")
    public ResponseEntity<Void> stripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {
        paymentService.processWebhook(stripeService.parseWebhook(payload, signature));
        return ResponseEntity.ok().build();
    }

    @Hidden
    @PostMapping("/webhooks/paypal")
    public ResponseEntity<Void> paypalWebhook(
            @RequestHeader Map<String, String> headers,
            @RequestBody Map<String, Object> payload) {
        paymentService.processWebhook(paypalService.parseWebhook(headers, payload));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/batch/bookings")
    @Operation(summary = "Resolve payments by booking IDs", description = "Internal read endpoint used by booking and admin views to attach payment state to multiple bookings.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Payments returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid booking id list")
    })
    public ResponseEntity<ApiResponse<Map<Long, PaymentDTO>>> getPaymentsByBookingIds(
            @RequestBody List<Long> bookingIds) {

        log.info("BATCH PAYMENT FETCH | size={}", bookingIds == null ? 0 : bookingIds.size());

        Map<Long, PaymentDTO> result =
                paymentService.getPaymentsByBookingIds(bookingIds);

        return ResponseUtil.ok(result);
    }

    @GetMapping("/booking/{bookingId}")
    @Operation(summary = "Get payment by booking", description = "Returns the latest payment record associated with a booking for booking detail and reconciliation views.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Payment returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid booking ID"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Payment not found")
    })
    public ResponseEntity<ApiResponse<PaymentDTO>> getPaymentByBookingId(
            @PathVariable Long bookingId) {

        return ResponseUtil.ok(paymentService.getPaymentByBookingId(bookingId));
    }

    @GetMapping
    @Operation(summary = "List payments", description = "Returns paginated payment records for operations/admin review. Sorting defaults to newest first and accepts service-supported fields only.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Payment page returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentication required")
    })
    public ResponseEntity<ApiResponse<Page<PaymentDTO>>> getAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection,
            @Parameter(hidden = true) @RequestHeader("X-User-Id") Long userId) {

        log.info("GET ALL PAYMENTS | userId={} | page={} | size={}", userId, page, size);

        if (page < 0 || size < 1 || size > 100
                || !java.util.Set.of("id", "createdAt", "updatedAt", "amount", "status").contains(sortBy)) {
            throw new com.triquang.exception.BaseException(com.triquang.enums.ErrorCode.INVALID_INPUT);
        }

        Sort.Direction direction = sortDirection.equalsIgnoreCase("ASC")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        Page<PaymentDTO> payments = paymentService.getAllPayments(pageable);

        return ResponseUtil.ok(payments);
    }
}
