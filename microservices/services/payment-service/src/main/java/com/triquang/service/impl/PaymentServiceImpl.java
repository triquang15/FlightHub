package com.triquang.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.client.UserClient;
import com.triquang.dto.UserDTO;
import com.triquang.enums.ErrorCode;
import com.triquang.enums.PaymentStatus;
import com.triquang.event.PaymentEventProducer;
import com.triquang.exception.BaseException;
import com.triquang.mapper.PaymentMapper;
import com.triquang.model.Payment;
import com.triquang.payload.PaymentDTO;
import com.triquang.payload.request.PaymentInitiateRequest;
import com.triquang.payload.request.PaymentVerifyRequest;
import com.triquang.payload.response.PaymentInitiateResponse;
import com.triquang.repository.PaymentRepository;
import com.triquang.service.PaymentService;
import com.triquang.service.gateway.PaypalService;
import com.triquang.service.gateway.StripeService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PaymentServiceImpl implements the core business logic for handling payments,
 * including initiating payments, verifying payment status, and fetching payment
 * details. It interacts with external payment gateways (Stripe and PayPal) and
 * ensures that all operations are transactional to maintain data integrity.
 *
 * @author Tri Quang
 */

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentEventProducer paymentEventProducer;
    private final UserClient userClient;

    private final StripeService stripeService;
    private final PaypalService paypalService;

    @Override
    @Transactional
    public PaymentInitiateResponse initiatePayment(PaymentInitiateRequest request) {

        log.info("Initiating payment for user: {} with gateway: {}",
                request.getUserId(), request.getGateway());

        // check duplicate payment
        paymentRepository.findByBookingId(request.getBookingId())
                .ifPresent(p -> {
                    if (p.getStatus() == PaymentStatus.SUCCESS) {
                        throw new BaseException(ErrorCode.PAYMENT_ALREADY_COMPLETED);
                    }
                });

        Payment payment = Payment.builder()
                .userId(request.getUserId())
                .bookingId(request.getBookingId())
                .amount(request.getAmount())
                .provider(request.getGateway())
                .status(PaymentStatus.PENDING)
                .transactionId(generateTransactionId())
                .build();

        payment = paymentRepository.save(payment);

        UserDTO user = userClient.getUserById(payment.getUserId());

        String checkoutUrl;

        switch (request.getGateway()) {

            case STRIPE:
                try {
                    checkoutUrl = stripeService.createCheckoutSession(payment, user);
                } catch (Exception e) {
                    log.error("Stripe error", e);
                    throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
                }
                break;

            case PAYPAL:
                try {
                    checkoutUrl = paypalService.createPayment(payment, user);
                } catch (Exception e) {
                    log.error("Paypal error", e);
                    throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
                }
                break;

            default:
                throw new BaseException(ErrorCode.UNSUPPORTED_PAYMENT_GATEWAY);
        }

        return PaymentInitiateResponse.builder()
                .paymentId(payment.getId())
                .gateway(payment.getProvider())
                .transactionId(payment.getTransactionId())
                .amount(payment.getAmount())
                .checkoutUrl(checkoutUrl)
                .success(true)
                .message("Payment initiated")
                .build();
    }

    @Override
    @Transactional
    public PaymentDTO verifyPayment(PaymentVerifyRequest request) {

        log.info("Verifying payment...");

        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new BaseException(ErrorCode.PAYMENT_NOT_FOUND));

        boolean isValid;

        switch (payment.getProvider()) {

            case STRIPE:
                try {
                    isValid = stripeService.verifyPayment(request.getStripeSessionId());
                } catch (Exception e) {
                    log.error("Stripe verify error", e);
                    throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
                }

                if (isValid) {
                    payment.setProviderPaymentId(request.getStripeSessionId());
                }
                break;

            case PAYPAL:
                try {
                    isValid = paypalService.verifyPayment(request.getPaypalOrderId());
                } catch (Exception e) {
                    log.error("Paypal verify error", e);
                    throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
                }

                if (isValid) {
                    payment.setProviderPaymentId(request.getPaypalOrderId());
                }
                break;

            default:
                throw new BaseException(ErrorCode.UNSUPPORTED_PAYMENT_GATEWAY);
        }

        if (isValid) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaidAt(LocalDateTime.now());

            payment = paymentRepository.save(payment);
            paymentEventProducer.sendPaymentCompleted(payment);

            log.info("Payment SUCCESS: {}", payment.getId());

        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Verification failed");

            payment = paymentRepository.save(payment);
            paymentEventProducer.sendPaymentFailed(payment);

            throw new BaseException(ErrorCode.PAYMENT_VERIFICATION_FAILED);
        }

        return PaymentMapper.toDTO(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentDTO> getAllPayments(Pageable pageable) {
        return paymentRepository.findAll(pageable)
                .map(PaymentMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, PaymentDTO> getPaymentsByBookingIds(List<Long> bookingIds) {
        if (bookingIds == null || bookingIds.isEmpty()) return Map.of();

        return paymentRepository.findByBookingIdIn(bookingIds)
                .stream()
                .collect(Collectors.toMap(
                        Payment::getBookingId,
                        PaymentMapper::toDTO
                ));
    }

    private String generateTransactionId() {
        return "TXN_" + System.currentTimeMillis() + "_" +
                UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
