package com.triquang.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@Component
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

    // ===================== FIXED METHODS =====================
    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractAuthorities(String token) {
        Object roles = extractAllClaims(token).get("roles");

        if (roles instanceof List<?> list) {
            return String.join(",",
                    list.stream().map(String::valueOf).toList());
        }

        return "";
    }

    public Long extractUserId(String token) {
        Object value = extractAllClaims(token).get("userId");

        if (value instanceof Integer i) return i.longValue();
        if (value instanceof Long l) return l;

        return Long.parseLong(String.valueOf(value));
    }

    // ===================== VALIDATION =====================
    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Duration getRemainingValidity(String token) {
        Date expiration = extractAllClaims(token).getExpiration();
        return Duration.between(Instant.now(), expiration.toInstant());
    }
}