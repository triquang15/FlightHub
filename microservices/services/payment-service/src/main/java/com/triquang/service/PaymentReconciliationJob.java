package com.triquang.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.triquang.enums.PaymentStatus;
import com.triquang.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "payment.reconciliation.enabled", havingValue = "true", matchIfMissing = true)
public class PaymentReconciliationJob {

    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;

    @Scheduled(fixedDelayString = "${payment.reconciliation.delay-ms:300000}")
    public void reconcileExpiredPayments() {
        paymentRepository.findByStatusInAndExpiresAtBefore(
                        List.of(PaymentStatus.PENDING, PaymentStatus.PROCESSING), LocalDateTime.now())
                .forEach(payment -> {
                    try {
                        paymentService.reconcilePayment(payment.getId());
                    } catch (Exception e) {
                        log.error("Payment reconciliation failed for payment {}", payment.getId(), e);
                    }
                });
    }
}
