package com.triquang.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@Component
@Slf4j
public class JwtUtil {

    private final SecretKey key;

    public JwtUtil() {
        this.key = Keys.hmacShaKeyFor(
                JwtConstant.SECRET_KEY.getBytes(StandardCharsets.UTF_8)
        );
    }

    // ===================== CORE =====================
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Claims safeExtractClaims(String token) {
        try {
            return extractAllClaims(token);
        } catch (JwtException e) {
            log.warn("Invalid JWT token received");
            return null;
        }
    }

    // ===================== CLAIM HELPERS =====================

    public String extractEmail(Claims claims) {
        return claims.getSubject();
    }

    public String extractAuthorities(Claims claims) {
        Object roles = claims.get("roles");

        if (roles instanceof List<?> list) {
            return String.join(",", list.stream().map(String::valueOf).toList());
        }

        return "";
    }

    public Long extractUserId(Claims claims) {
        Object value = claims.get("userId");

        if (value instanceof Integer i) return i.longValue();
        if (value instanceof Long l) return l;

        return Long.parseLong(String.valueOf(value));
    }

    // ===================== VALIDATION =====================

    public boolean isTokenExpired(Claims claims) {
        return claims.getExpiration().before(new Date());
    }

    public boolean isTokenValid(Claims claims) {
        return !isTokenExpired(claims);
    }

    // ===================== TTL =====================

    public Duration getRemainingValidity(Claims claims) {
        Duration duration = Duration.between(
                Instant.now(),
                claims.getExpiration().toInstant()
        );

        return duration.isNegative() ? Duration.ZERO : duration;
    }
}