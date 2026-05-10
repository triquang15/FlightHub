package com.triquang.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.triquang.config.JwtConstant;
import com.triquang.config.JwtUtil;
import com.triquang.enums.ErrorCode;
import com.triquang.service.TokenBlacklistService;
import com.triquang.utils.ResponseUtil;

import io.jsonwebtoken.Claims;

import java.time.Duration;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class LogoutController {

    private final JwtUtil jwtUtil;
    private final TokenBlacklistService blacklistService;

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @RequestHeader(value = JwtConstant.JWT_HEADER, required = false) String authHeader) {

        // 1. HEADER
        if (authHeader == null || !authHeader.startsWith(JwtConstant.TOKEN_PREFIX)) {
            log.warn("Logout failed: invalid Authorization header");
            return ResponseUtil.error(ErrorCode.UNAUTHORIZED);
        }

        String token = authHeader.substring(JwtConstant.TOKEN_PREFIX.length());

        // 2. PARSE TOKEN (ONCE)
        Claims claims = jwtUtil.safeExtractClaims(token);

        if (claims == null) {
            log.warn("Logout skipped: invalid token");
            return ResponseUtil.ok("Token already invalid");
        }

        // 3. EXPIRED
        if (jwtUtil.isTokenExpired(claims)) {
            log.info("Logout skipped: token already expired");
            return ResponseUtil.ok("Token already expired");
        }

        // 4. TTL
        Duration ttl = jwtUtil.getRemainingValidity(claims);

        if (ttl.isZero() || ttl.isNegative()) {
            log.warn("Skip blacklist: TTL <= 0");
            return ResponseUtil.ok("Token already expired");
        }

        // 5. BLACKLIST
        try {
            blacklistService.blacklist(token, ttl);
            log.info("Logout success - token blacklisted (ttl={}s)", ttl.toSeconds());
        } catch (Exception e) {
            log.error("Redis error during logout", e);
        }

        // 6. RESPONSE
        return ResponseUtil.ok("Logged out successfully");
    }
}