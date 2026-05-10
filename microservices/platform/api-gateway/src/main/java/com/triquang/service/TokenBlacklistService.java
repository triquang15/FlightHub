package com.triquang.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    private static final String PREFIX = "jwt:blacklist:";

    private final StringRedisTemplate redisTemplate;

    // =========================
    // PUBLIC API
    // =========================

    public void blacklist(String token, Duration ttl) {

        String key = resolveKey(token, ttl);
        if (key == null) return;

        try {
            redisTemplate.opsForValue().set(key, "1", ttl);
            log.info("Token blacklisted (ttl={}s)", ttl.toSeconds());
        } catch (Exception e) {
            log.error("Redis error during blacklist", e);
        }
    }

    public boolean isBlacklisted(String token) {

        String key = resolveKey(token, null);
        if (key == null) return false;

        try {
            return redisTemplate.opsForValue().get(key) != null;
        } catch (Exception e) {
            log.error("Redis error during blacklist check", e);
            return false;
        }
    }

    // =========================
    // INTERNAL
    // =========================

    private String resolveKey(String token, Duration ttl) {

        if (token == null || token.isBlank()) {
            log.warn("Skip blacklist: token is null/blank");
            return null;
        }

        if (ttl != null && (ttl.isZero() || ttl.isNegative())) {
            log.warn("Skip blacklist: invalid TTL");
            return null;
        }

        return PREFIX + hash(token);
    }

    private String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }
}