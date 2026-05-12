package com.triquang.service;

import com.triquang.payload.request.SignupRequest;
import com.triquang.payload.response.AuthResponse;

public interface AuthService {

    AuthResponse signup(SignupRequest req, String ip, String agent);

    AuthResponse login(String email, String password,
                       String deviceId, String ip, String userAgent);

    AuthResponse refreshToken(String refreshToken,
                              String deviceId, String ip, String userAgent);

    void revokeRefreshToken(String token, String deviceId, Long userId);

    void revokeAllRefreshTokens(Long userId);
}