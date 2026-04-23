package com.triquang.service;

import com.triquang.exception.UserException;
import com.triquang.payload.request.SignupRequest;
import com.triquang.payload.response.AuthResponse;

public interface AuthService {
	AuthResponse signup(SignupRequest req) throws UserException;

	AuthResponse login(String email, String password) throws UserException;

	AuthResponse refreshToken(String refreshToken) throws UserException;

}
