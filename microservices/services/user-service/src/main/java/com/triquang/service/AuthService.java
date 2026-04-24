package com.triquang.service;

import com.triquang.payload.request.SignupRequest;
import com.triquang.payload.response.AuthResponse;

public interface AuthService {
	AuthResponse signup(SignupRequest req);

	AuthResponse login(String email, String password);

	AuthResponse refreshToken(String refreshToken);

}
