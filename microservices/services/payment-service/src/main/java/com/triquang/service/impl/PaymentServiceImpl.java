package com.triquang.service.impl;

import java.time.LocalDateTime;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.client.UserClient;
import com.triquang.dto.UserDTO;
import com.triquang.enums.ErrorCode;
import com.triquang.enums.PaymentStatus;
import com.triquang.enums.PaymentGateway;
import com.triquang.enums.UserRole;
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
import com.triquang.service.gateway.PaymentCheckoutResult;
import com.triquang.service.gateway.PaymentVerificationResult;
import com.triquang.service.gateway.StripeService;
import com.triquang.service.gateway.ProviderWebhookEvent;

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

    @Value("${app.internal.secret}")
    private String internalSecret;

    @Value("${payment.settlement-currency:USD}")
    private String settlementCurrency = "USD";

    @Override
    @Transactional
    public PaymentInitiateResponse initiatePayment(PaymentInitiateRequest request) {

        log.info("Initiating payment for user: {} with gateway: {}",
                request.getUserId(), request.getGateway());
        validateInitiateRequest(request);
        request.setCurrency(request.getCurrency().trim().toUpperCase());
        request.setAmount(request.getAmount().setScale(2, RoundingMode.HALF_UP));
        paymentRepository.lockBookingPayment(request.getBookingId());

        Payment payment = paymentRepository.findTopByBookingIdOrderByUpdatedAtDesc(request.getBookingId())
                .map(existing -> prepareExistingPayment(existing, request))
                .orElseGet(() -> createPayment(request));

        UserDTO user = userClient.getUserById(payment.getUserId(), internalSecret);
        if (user == null) {
            throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
        }

        payment.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        PaymentCheckoutResult checkout;

        switch (request.getGateway()) {

            case STRIPE:
                try {
                    checkout = stripeService.createCheckoutSession(payment, user);
                } catch (Exception e) {
                    log.error("Stripe error", e);
                    throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
                }
                break;

            case PAYPAL:
                try {
                    checkout = paypalService.createPayment(payment, user);
                } catch (Exception e) {
                    log.error("Paypal error", e);
                    throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
                }
                break;

            default:
                throw new BaseException(ErrorCode.UNSUPPORTED_PAYMENT_GATEWAY);
        }

        payment.setProviderCheckoutId(checkout.providerCheckoutId());
        payment = paymentRepository.save(payment);

        return PaymentInitiateResponse.builder()
                .paymentId(payment.getId())
                .gateway(payment.getProvider())
                .transactionId(payment.getTransactionId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .description(request.getDescription())
                .checkoutUrl(checkout.checkoutUrl())
                .success(true)
                .message("Payment initiated")
                .build();
    }

    @Override
    @Transactional
    public PaymentDTO verifyPayment(PaymentVerifyRequest request, Long userId) {

        log.info("Verifying payment...");
        if (request == null || request.getPaymentId() == null) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        if (userId == null) {
            throw new BaseException(ErrorCode.UNAUTHORIZED);
        }

        Payment payment = paymentRepository.findByIdForUpdate(request.getPaymentId())
                .orElseThrow(() -> new BaseException(ErrorCode.PAYMENT_NOT_FOUND));

        if (!Objects.equals(payment.getUserId(), userId)) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.info("Payment {} already verified as SUCCESS", payment.getId());
            return PaymentMapper.toDTO(payment);
        }

        if (payment.getStatus() != PaymentStatus.PENDING
                && payment.getStatus() != PaymentStatus.PROCESSING) {
            throw new BaseException(ErrorCode.PAYMENT_VERIFICATION_FAILED);
        }

        PaymentVerificationResult verification;

        switch (payment.getProvider()) {

            case STRIPE:
                requireProviderReference(request.getStripeSessionId());
                try {
                    verification = stripeService.verifyPayment(request.getStripeSessionId());
                } catch (Exception e) {
                    log.error("Stripe verify error", e);
                    throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
                }

                break;

            case PAYPAL:
                requireProviderReference(request.getPaypalOrderId());
                try {
                    verification = paypalService.verifyPayment(request.getPaypalOrderId());
                } catch (Exception e) {
                    log.error("Paypal verify error", e);
                    throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
                }

                break;

            default:
                throw new BaseException(ErrorCode.UNSUPPORTED_PAYMENT_GATEWAY);
        }

        if (verification == null || !verification.completed()) {
            failPayment(payment, "Provider checkout was not completed");
            throw new BaseException(ErrorCode.PAYMENT_VERIFICATION_FAILED);
        }

        if (!matchesPayment(verification, payment)) {
            failPayment(payment, "Provider transaction does not match local payment");
            throw new BaseException(ErrorCode.PAYMENT_VERIFICATION_FAILED);
        }

        return PaymentMapper.toDTO(completePayment(payment, verification));
    }

    @Override
    @Transactional
    public PaymentDTO cancelPaymentByBookingId(Long bookingId, Long userId) {
        if (bookingId == null || userId == null) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        paymentRepository.lockBookingPayment(bookingId);
        Payment payment = paymentRepository.findTopByBookingIdOrderByUpdatedAtDesc(bookingId)
                .orElseThrow(() -> new BaseException(ErrorCode.PAYMENT_NOT_FOUND));

        if (!Objects.equals(payment.getUserId(), userId)) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }
        if (payment.getStatus() == PaymentStatus.CANCELLED) {
            return PaymentMapper.toDTO(payment);
        }
        if (payment.getStatus() == PaymentStatus.SUCCESS || payment.getStatus() == PaymentStatus.REFUNDED) {
            throw new BaseException(ErrorCode.PAYMENT_ALREADY_COMPLETED);
        }

        payment.setStatus(PaymentStatus.CANCELLED);
        payment.setFailureReason("Cancelled with booking");
        expireProviderCheckout(payment);
        return PaymentMapper.toDTO(paymentRepository.save(payment));
    }

    @Override
    @Transactional
    public void processWebhook(ProviderWebhookEvent event) {
        if (event == null || event.verification() == null || event.verification().paymentId() == null) {
            return;
        }

        Payment payment = paymentRepository.findByIdForUpdate(event.verification().paymentId())
                .orElseThrow(() -> new BaseException(ErrorCode.PAYMENT_NOT_FOUND));
        if (payment.getProvider() != event.gateway() || payment.getStatus() == PaymentStatus.REFUNDED) {
            return;
        }
        if (event.terminalFailure()) {
            if (payment.getStatus() == PaymentStatus.PENDING || payment.getStatus() == PaymentStatus.PROCESSING) {
                failPayment(payment, "Provider event: " + event.eventType());
            }
            return;
        }
        if (!event.verification().completed() || !matchesPayment(event.verification(), payment)) {
            return;
        }
        if (payment.getStatus() == PaymentStatus.CANCELLED) {
            payment.setProviderPaymentId(event.verification().providerPaymentId());
            refundProviderPayment(payment);
            return;
        }
        if (payment.getStatus() == PaymentStatus.PENDING || payment.getStatus() == PaymentStatus.PROCESSING) {
            completePayment(payment, event.verification());
        }
    }

    @Override
    @Transactional
    public PaymentDTO refundPayment(Long paymentId, String roles) {
        boolean systemAdmin = roles != null && java.util.Arrays.stream(roles.split(","))
                .map(String::trim)
                .anyMatch(UserRole.ROLE_SYSTEM_ADMIN.name()::equals);
        if (paymentId == null || !systemAdmin) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }

        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new BaseException(ErrorCode.PAYMENT_NOT_FOUND));
        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            return PaymentMapper.toDTO(payment);
        }
        if (payment.getStatus() != PaymentStatus.SUCCESS
                || payment.getProviderPaymentId() == null
                || payment.getProviderPaymentId().isBlank()) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        return PaymentMapper.toDTO(refundProviderPayment(payment));
    }

    @Override
    @Transactional
    public void reconcilePayment(Long paymentId) {
        Payment payment = paymentRepository.findByIdForUpdate(paymentId).orElse(null);
        if (payment == null || (payment.getStatus() != PaymentStatus.PENDING
                && payment.getStatus() != PaymentStatus.PROCESSING)) {
            return;
        }

        PaymentVerificationResult verification = inspectProviderPayment(payment);
        if (verification != null && verification.completed() && matchesPayment(verification, payment)) {
            completePayment(payment, verification);
            return;
        }
        if (payment.getExpiresAt() != null && !payment.getExpiresAt().isAfter(LocalDateTime.now())) {
            expireProviderCheckout(payment);
            failPayment(payment, "Payment checkout expired");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentDTO> getAllPayments(Pageable pageable) {
        return paymentRepository.findAll(pageable)
                .map(PaymentMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentDTO getPaymentByBookingId(Long bookingId) {
        if (bookingId == null) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        return paymentRepository.findTopByBookingIdOrderByUpdatedAtDesc(bookingId)
                .map(PaymentMapper::toDTO)
                .orElseThrow(() -> new BaseException(ErrorCode.PAYMENT_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, PaymentDTO> getPaymentsByBookingIds(List<Long> bookingIds) {
        if (bookingIds == null || bookingIds.isEmpty()) return Map.of();

        return paymentRepository.findByBookingIdInOrderByUpdatedAtDesc(bookingIds)
                .stream()
                .collect(Collectors.toMap(
                        Payment::getBookingId,
                        PaymentMapper::toDTO,
                        (latest, ignored) -> latest
                ));
    }

    private String generateTransactionId() {
        return "TXN_" + System.currentTimeMillis() + "_" +
                UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private void validateInitiateRequest(PaymentInitiateRequest request) {
        if (request.getUserId() == null
                || request.getBookingId() == null
                || request.getGateway() == null
                || request.getCurrency() == null
                || !request.getCurrency().trim().matches("(?i)[A-Z]{3}")
                || request.getAmount() == null
                || request.getAmount().signum() <= 0) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        if (!settlementCurrency.equalsIgnoreCase(request.getCurrency().trim())) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }

    private Payment createPayment(PaymentInitiateRequest request) {
        Payment payment = Payment.builder()
                .userId(request.getUserId())
                .bookingId(request.getBookingId())
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .provider(request.getGateway())
                .status(PaymentStatus.PENDING)
                .transactionId(generateTransactionId())
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();

        return paymentRepository.save(payment);
    }

    private Payment prepareExistingPayment(Payment payment, PaymentInitiateRequest request) {
        if (!Objects.equals(payment.getUserId(), request.getUserId())) {
            throw new BaseException(ErrorCode.FORBIDDEN);
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new BaseException(ErrorCode.PAYMENT_ALREADY_COMPLETED);
        }

        if (payment.getStatus() == PaymentStatus.PENDING || payment.getStatus() == PaymentStatus.PROCESSING) {
            ensureSameCommercialTerms(payment, request);
            return payment;
        }

        if (payment.getStatus() == PaymentStatus.FAILED || payment.getStatus() == PaymentStatus.CANCELLED) {
            payment.setAmount(request.getAmount());
            payment.setCurrency(request.getCurrency());
            payment.setProvider(request.getGateway());
            payment.setStatus(PaymentStatus.PENDING);
            payment.setTransactionId(generateTransactionId());
            payment.setProviderPaymentId(null);
            payment.setProviderCheckoutId(null);
            payment.setFailureReason(null);
            payment.setPaidAt(null);
            payment.setExpiresAt(LocalDateTime.now().plusMinutes(30));
            return paymentRepository.save(payment);
        }

        throw new BaseException(ErrorCode.INVALID_INPUT);
    }

    private void ensureSameCommercialTerms(Payment payment, PaymentInitiateRequest request) {
        boolean sameGateway = payment.getProvider() == request.getGateway();
        boolean sameAmount = payment.getAmount() != null
                && payment.getAmount().compareTo(request.getAmount()) == 0;
        boolean sameCurrency = payment.getCurrency() != null
                && payment.getCurrency().equalsIgnoreCase(request.getCurrency());

        if (!sameGateway || !sameAmount || !sameCurrency) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }

    private void requireProviderReference(String providerReference) {
        if (providerReference == null || providerReference.isBlank()) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }

    private boolean matchesPayment(PaymentVerificationResult verification, Payment payment) {
        boolean sameCheckout = Objects.equals(
                verification.providerCheckoutId(), payment.getProviderCheckoutId());
        boolean samePayment = Objects.equals(verification.paymentId(), payment.getId());
        boolean sameAmount = verification.amount() != null
                && verification.amount().compareTo(payment.getAmount()) == 0;
        boolean sameCurrency = verification.currency() != null
                && verification.currency().equalsIgnoreCase(payment.getCurrency());

        if (!sameCheckout || !samePayment || !sameAmount || !sameCurrency) {
            log.warn("Provider payment mismatch | paymentId={} | providerPaymentId={} | providerAmount={} | providerCurrency={}",
                    payment.getId(), verification.paymentId(), verification.amount(), verification.currency());
        }
        return sameCheckout && samePayment && sameAmount && sameCurrency;
    }

    private Payment completePayment(Payment payment, PaymentVerificationResult verification) {
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return payment;
        }
        payment.setProviderPaymentId(verification.providerPaymentId());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setFailureReason(null);
        payment.setPaidAt(LocalDateTime.now());
        payment = paymentRepository.save(payment);
        paymentEventProducer.sendPaymentCompleted(payment);
        log.info("Payment SUCCESS: {}", payment.getId());
        return payment;
    }

    private void failPayment(Payment payment, String reason) {
        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason(reason);
        payment = paymentRepository.save(payment);
        paymentEventProducer.sendPaymentFailed(payment);
    }

    private PaymentVerificationResult inspectProviderPayment(Payment payment) {
        if (payment.getProviderCheckoutId() == null || payment.getProviderCheckoutId().isBlank()) {
            return null;
        }
        return switch (payment.getProvider()) {
            case STRIPE -> stripeService.verifyPayment(payment.getProviderCheckoutId());
            case PAYPAL -> paypalService.inspectPayment(payment.getProviderCheckoutId());
            default -> null;
        };
    }

    private void expireProviderCheckout(Payment payment) {
        if (payment.getProvider() == PaymentGateway.STRIPE
                && payment.getProviderCheckoutId() != null) {
            stripeService.expireCheckout(payment.getProviderCheckoutId());
        }
    }

    private Payment refundProviderPayment(Payment payment) {
        String idempotencyKey = "refund-payment-" + payment.getId();
        String refundId = switch (payment.getProvider()) {
            case STRIPE -> stripeService.refund(payment.getProviderPaymentId(), idempotencyKey);
            case PAYPAL -> paypalService.refund(payment.getProviderPaymentId(), idempotencyKey);
            default -> throw new BaseException(ErrorCode.UNSUPPORTED_PAYMENT_GATEWAY);
        };
        payment.setRefundId(refundId);
        payment.setStatus(PaymentStatus.REFUNDED);
        payment = paymentRepository.save(payment);
        paymentEventProducer.sendPaymentRefunded(payment);
        return payment;
    }
}
