package com.triquang.service.impl;

import java.time.LocalDateTime;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.triquang.config.JwtProvider;
import com.triquang.enums.ErrorCode;
import com.triquang.enums.UserRole;
import com.triquang.exception.BaseException;
import com.triquang.mapper.UserMapper;
import com.triquang.model.User;
import com.triquang.payload.request.SignupRequest;
import com.triquang.payload.response.AuthResponse;
import com.triquang.repository.UserRepository;
import com.triquang.service.AuthService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
/**
 * AuthServiceImpl handles user authentication and registration logic.
 * It uses Spring Security for authentication and JWT for token management.
 * 
 * @author Tri Quang
 */

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final CustomUserDetailsService customUserDetailsService;
    private final AuthenticationManager authenticationManager;

    // =========================
    // SIGNUP
    // =========================
    @Override
    public AuthResponse signup(SignupRequest req) {

        validateSignup(req);

        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new BaseException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setFullName(req.getFullName());
        user.setPhone(req.getPhone());
        user.setRole(UserRole.ROLE_CUSTOMER);

        // signup is NOT login → no lastLogin here
        user.setLastLogin(null);

        user = userRepository.save(user);

        log.info("User registered: {}", user.getEmail());

        return buildAuthResponse(user);
    }

    // =========================
    // LOGIN
    // =========================
    @Override
    public AuthResponse login(String email, String password) {

        try {
            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(email, password)
                    );

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            log.info("User logged in: {}", email);

            return buildAuthResponse(user);

        } catch (Exception ex) {
            // IMPORTANT: convert all auth failures
            throw new BaseException(ErrorCode.INVALID_CREDENTIALS);
        }
    }

    // =========================
    // REFRESH TOKEN
    // =========================
    @Override
    public AuthResponse refreshToken(String refreshToken) {

        if (!jwtProvider.validateToken(refreshToken)) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        if (!jwtProvider.isRefreshToken(refreshToken)) {
            throw new BaseException(ErrorCode.INVALID_REFRESH_TOKEN);
        }

        String email = jwtProvider.getUsername(refreshToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        log.info("Token refreshed for user: {}", email);

        return buildAuthResponse(user);
    }

    // =========================
    // AUTH RESPONSE BUILDER
    // =========================
    private AuthResponse buildAuthResponse(User user) {

        UserDetails userDetails =
                customUserDetailsService.loadUserByUsername(user.getEmail());

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

        String accessToken =
                jwtProvider.generateAccessToken(authentication, user.getId());

        String refreshToken =
                jwtProvider.generateRefreshToken(authentication, user.getId());

        return new AuthResponse(
                accessToken,
                refreshToken,
                "Success",
                "OK",
                UserMapper.toDTO(user)
        );
    }

    // =========================
    // VALIDATION
    // =========================
    private void validateSignup(SignupRequest req) {

        if (req.getEmail() == null || req.getEmail().isBlank()) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        if (req.getPassword() == null || req.getPassword().length() < 6) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }
    }
}