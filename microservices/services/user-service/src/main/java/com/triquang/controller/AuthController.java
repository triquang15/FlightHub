package com.triquang.controller;

import com.triquang.payload.request.LoginRequest;
import com.triquang.payload.request.RefreshTokenRequest;
import com.triquang.payload.request.SignupRequest;
import com.triquang.payload.response.ApiResponse;
import com.triquang.payload.response.AuthResponse;
import com.triquang.service.AuthService;
import com.triquang.utils.ResponseUtil;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;

	// ---------- SIGNUP ----------
	@PostMapping("/signup")
	public ResponseEntity<ApiResponse<AuthResponse>> signup(@Valid @RequestBody SignupRequest req) {

		return ResponseUtil.created(authService.signup(req));
	}

	// ---------- LOGIN ----------
	@PostMapping("/login")
	public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest req) {

		return ResponseUtil.ok(authService.login(req.getEmail(), req.getPassword()));
	}

	// ---------- REFRESH ----------
	@PostMapping("/refresh")
	public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest req) {

		return ResponseUtil.ok(authService.refreshToken(req.getRefreshToken()));
	}
}