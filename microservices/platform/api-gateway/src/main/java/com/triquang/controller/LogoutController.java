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

import java.time.Duration;

/**
 * Handles logout by revoking the JWT token in Redis.
 */
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

		// =========================
		// 1. CHECK HEADER
		// =========================
		if (authHeader == null || !authHeader.startsWith(JwtConstant.TOKEN_PREFIX)) {
			return ResponseUtil.error(ErrorCode.UNAUTHORIZED);
		}

		String token = authHeader.substring(JwtConstant.TOKEN_PREFIX.length());

		// =========================
		// 2. TOKEN INVALID
		// =========================
		if (!jwtUtil.isTokenValid(token)) {
			return ResponseUtil.ok("Token already invalid");
		}

		// =========================
		// 3. BLACKLIST TOKEN
		// =========================
		Duration ttl = jwtUtil.getRemainingValidity(token);
		blacklistService.blacklist(token, ttl);

		log.info("User logged out — token blacklisted for {}s", ttl.toSeconds());

		return ResponseUtil.ok("Logged out successfully");
	}
}