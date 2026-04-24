package com.triquang.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.triquang.payload.request.LoginRequest;
import com.triquang.payload.request.RefreshTokenRequest;
import com.triquang.payload.request.SignupRequest;
import com.triquang.payload.response.AuthResponse;
import com.triquang.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;

	@PostMapping("/signup")
	public ResponseEntity<AuthResponse> signup(@RequestBody @Valid SignupRequest req) {
	    return ResponseEntity.ok(authService.signup(req));
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@RequestBody @Valid LoginRequest req) {
	    return ResponseEntity.ok(authService.login(req.getEmail(), req.getPassword()));
	}

	@PostMapping("/refresh")
	public ResponseEntity<AuthResponse> refresh(@RequestBody @Valid RefreshTokenRequest req) {
	    return ResponseEntity.ok(authService.refreshToken(req.getRefreshToken()));
	}
}
