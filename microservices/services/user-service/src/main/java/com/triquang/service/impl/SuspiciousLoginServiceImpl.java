package com.triquang.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.triquang.kafka.SecurityEventProducer;
import com.triquang.message.SuspiciousLoginEvent;
import com.triquang.model.LoginAudit;
import com.triquang.repository.KnownDeviceRepository;
import com.triquang.repository.LoginAuditRepository;
import com.triquang.repository.SessionRepository;
import com.triquang.service.SuspiciousLoginService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SuspiciousLoginServiceImpl implements SuspiciousLoginService {

    private final SessionRepository sessionRepo;
    private final KnownDeviceRepository knownDeviceRepo;
    private final LoginAuditRepository loginAuditRepo;
    private final SecurityEventProducer securityEventProducer;

    // ================= CONFIG =================
    private static final int FAIL_THRESHOLD = 3;
    private static final int WINDOW_MINUTES = 5;

    // ================= DETECT =================
    @Override
    public boolean isSuspicious(Long userId, String email, String deviceId, String ip) {

        boolean newDevice = isNewDevice(userId, deviceId);
        boolean newIp = isNewIp(email, ip);
        boolean failThenSuccess = detectFailThenSuccess(email);

        return newDevice || newIp || failThenSuccess;
    }

    // ================= HANDLE =================
    @Override
    public void handleSuspicious(Long userId, String email, String deviceId, String ip) {

        // 1. Structured log (production-friendly)
        log.warn("SECURITY_ALERT type=SUSPICIOUS_LOGIN userId={} email={} deviceId={} ip={}",
                userId, email, deviceId, ip);

        // 2. Publish Kafka event (decoupled notification)
        try {
            var event = SuspiciousLoginEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .userId(userId)
                    .email(email)
                    .deviceId(deviceId)
                    .ip(ip)
                    .timestamp(LocalDateTime.now())
                    .build();

            securityEventProducer.sendSuspiciousLoginEvent(event);

            log.info("Kafka event published: suspicious-login → {}", email);

        } catch (Exception e) {
            // ❗ Không throw (không ảnh hưởng login flow)
            log.error("Failed to publish suspicious login event for {}", email, e);
        }
    }

    // ================= RULE 1: DEVICE =================
    private boolean isNewDevice(Long userId, String deviceId) {

        if (deviceId == null) return false;

        if (knownDeviceRepo.existsByUserIdAndDeviceId(userId, deviceId)) {
            return false;
        }

        return sessionRepo.findByUserIdAndDeviceId(userId, deviceId).isEmpty();
    }

    // ================= RULE 2: IP =================
    private boolean isNewIp(String email, String ip) {

        if (ip == null) return false;

        List<LoginAudit> logs =
                loginAuditRepo.findTop5ByEmailOrderByCreatedAtDesc(email);

        return logs.stream()
                .noneMatch(l -> ip.equals(l.getIpAddress()));
    }

    // ================= RULE 3: FAIL → SUCCESS =================
    private boolean detectFailThenSuccess(String email) {

        long failCount = loginAuditRepo.countByEmailAndSuccessFalseAndCreatedAtAfter(
                email,
                LocalDateTime.now().minusMinutes(WINDOW_MINUTES)
        );

        return failCount >= FAIL_THRESHOLD;
    }
}
