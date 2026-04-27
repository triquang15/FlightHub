package com.triquang.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Manages blacklisted JWTs (e.g. after user logout) using Redis for storage.
 * Tokens are stored with a TTL equal to their remaining validity, so Redis auto-cleans expired tokens.
 * If Redis is unavailable, blacklisting is effectively disabled (tokens are treated as valid).
 * 
 * @author Tri Quang
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    private static final String PREFIX = "jwt:blacklist:";

    private final StringRedisTemplate redisTemplate;

    /**
     * Adds a token to the blacklist with a TTL so Redis auto-cleans expired tokens.
     *
     * @param token raw JWT (without "Bearer " prefix)
     * @param ttl time until the token naturally expires
     */
    public void blacklist(String token, Duration ttl) {
        if (ttl.isNegative() || ttl.isZero()) {
            return;
        }
        try {
            redisTemplate.opsForValue().set(PREFIX + token, "1", ttl);
            log.debug("Token blacklisted for {}s", ttl.toSeconds());
        } catch (Exception e) {
            log.warn("Redis unavailable — token blacklisting skipped: {}", e.getMessage());
        }
    }

    /**
     * Returns {@code true} if the token has been revoked (i.e. the user logged out).
     * Returns {@code false} when Redis is unavailable — token is treated as valid.
     */
    public boolean isBlacklisted(String token) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(PREFIX + token));
        } catch (Exception e) {
            log.warn("Redis unavailable for blacklist check — treating token as valid: {}", e.getMessage());
            return false;
        }
    }
}
