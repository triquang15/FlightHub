package com.triquang.service.impl;

import java.time.LocalDateTime;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.config.JwtProvider;
import com.triquang.enums.ErrorCode;
import com.triquang.enums.UserRole;
import com.triquang.exception.BaseException;
import com.triquang.mapper.UserMapper;
import com.triquang.model.KnownDevice;
import com.triquang.model.RefreshToken;
import com.triquang.model.Session;
import com.triquang.model.User;
import com.triquang.model.UserPreferences;
import com.triquang.payload.request.SignupRequest;
import com.triquang.payload.response.AuthResponse;
import com.triquang.repository.LoginAuditRepository;
import com.triquang.repository.KnownDeviceRepository;
import com.triquang.repository.RefreshTokenRepository;
import com.triquang.repository.SessionRepository;
import com.triquang.repository.UserRepository;
import com.triquang.repository.UserPreferencesRepository;
import com.triquang.service.AuthService;
import com.triquang.service.SuspiciousLoginService;
import com.triquang.utils.TokenHashUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepo;
    private final SessionRepository sessionRepo;
    private final KnownDeviceRepository knownDeviceRepo;
    private final LoginAuditRepository loginAuditRepo;
    private final UserPreferencesRepository userPreferencesRepository;

    private final JwtProvider jwtProvider;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService customUserDetailsService;
    private final TokenHashUtil tokenHashUtil;
    private final SuspiciousLoginService suspiciousLoginService;
    private final PasswordEncoder passwordEncoder;

    private final AuditService auditService;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int BLOCK_MINUTES = 5;

    // ================= SIGNUP =================
    @Override
    public AuthResponse signup(SignupRequest req, String ip, String agent) {

        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new BaseException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        String deviceId = normalizeDeviceId(req.getDeviceId());

        UserRole userRole = resolveSignupRole(req.getRole());

        User user = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .role(userRole)
                .verified(true)
                .active(true)
                .build();

        userRepository.save(user);
        userPreferencesRepository.save(UserPreferences.builder()
                .user(user)
                .build());

        upsertKnownDevice(user, deviceId, ip, agent);
        upsertSession(user, deviceId, ip, agent);

        return buildAuthResponse(user, deviceId, ip, agent);
    }

    // ================= LOGIN =================
    @Override
    public AuthResponse login(String email, String password,
                             String deviceId, String ip, String agent) {

        String normalizedDeviceId = normalizeDeviceId(deviceId);
        
        checkBruteForce(email);

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

            if (!user.isActive()) throw new BaseException(ErrorCode.ACCOUNT_DISABLED);
            if (!user.isVerified()) throw new BaseException(ErrorCode.EMAIL_NOT_VERIFIED);

            boolean suspicious = suspiciousLoginService.isSuspicious(
                    user.getId(), email, normalizedDeviceId, ip
            );

            if (suspicious) {
                suspiciousLoginService.handleSuspicious(
                        user.getId(), email, normalizedDeviceId, ip
                );
            }

            user.setLastLogin(LocalDateTime.now());

            auditService.saveLoginAudit(email, true, ip, agent);

            upsertKnownDevice(user, normalizedDeviceId, ip, agent);
            upsertSession(user, normalizedDeviceId, ip, agent);

            return buildAuthResponse(user, normalizedDeviceId, ip, agent);

        } catch (BaseException ex) {
            throw ex;
        } catch (Exception ex) {

            auditService.saveLoginAudit(email, false, ip, agent);

            checkBruteForce(email);

            throw new BaseException(ErrorCode.INVALID_CREDENTIALS);
        }
    }

    // ================= REFRESH =================
    @Override
    public AuthResponse refreshToken(String refreshToken,
                                     String deviceId, String ip, String agent) {

        if (!jwtProvider.validateToken(refreshToken)) {
            throw new BaseException(ErrorCode.INVALID_TOKEN);
        }

        String normalizedDeviceId = normalizeDeviceId(deviceId);
        String hash = tokenHashUtil.hash(refreshToken);

        RefreshToken token = refreshTokenRepo.findByTokenHash(hash)
                .orElseThrow(() -> new BaseException(ErrorCode.TOKEN_NOT_FOUND));

        if (!token.getDeviceId().equals(normalizedDeviceId)) {
            throw new BaseException(ErrorCode.INVALID_DEVICE);
        }

        if (token.isRevoked()) {
            token.setReused(true);
            revokeAllRefreshTokens(token.getUser().getId());
            throw new BaseException(ErrorCode.TOKEN_REUSED);
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BaseException(ErrorCode.TOKEN_EXPIRED);
        }

        token.setRevoked(true);

        return buildAuthResponse(token.getUser(), normalizedDeviceId, ip, agent);
    }

    // ================= LOGOUT =================
    @Override
    public void revokeRefreshToken(String rawToken, String deviceId, Long userId) {

        String normalizedDeviceId = normalizeDeviceId(deviceId);
        String hash = tokenHashUtil.hash(rawToken);

        RefreshToken token = refreshTokenRepo.findByTokenHash(hash)
                .orElseThrow(() -> new BaseException(ErrorCode.TOKEN_NOT_FOUND));

        if (!token.getUser().getId().equals(userId)) {
            throw new BaseException(ErrorCode.UNAUTHORIZED);
        }

        token.setRevoked(true);

        sessionRepo.deleteByUserIdAndDeviceId(userId, normalizedDeviceId);
    }

    @Override
    public void revokeAllRefreshTokens(Long userId) {
        refreshTokenRepo.revokeAllByUserId(userId);
        sessionRepo.deleteByUserId(userId);
    }

    // ================= CORE =================
	private AuthResponse buildAuthResponse(User user, String deviceId, String ip, String agent) {

		UserDetails userDetails = customUserDetailsService.loadUserByUsername(user.getEmail());

		Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null,
				userDetails.getAuthorities());

		String accessToken = jwtProvider.generateAccessToken(authentication, user.getId(), user.getTokenVersion());

		String refreshToken = jwtProvider.generateRefreshToken(authentication, user.getId());

		refreshTokenRepo.save(RefreshToken.builder()
				.user(user)
				.tokenHash(tokenHashUtil.hash(refreshToken))
				.expiresAt(LocalDateTime.now().plusDays(7))
				.deviceId(deviceId)
				.ipAddress(ip)
				.userAgent(agent).build());

		return new AuthResponse(accessToken, refreshToken, "Success", "OK", UserMapper.toDTO(user));
	}

    // ================= HELPERS =================
    private String normalizeDeviceId(String deviceId) {
        if (deviceId == null || deviceId.isBlank()) {
            return "unknown-device";
        }
        return deviceId.trim().toLowerCase();
    }

    private UserRole resolveSignupRole(UserRole requestedRole) {
        if (requestedRole == null) {
            return UserRole.ROLE_CUSTOMER;
        }

        if (requestedRole == UserRole.ROLE_SYSTEM_ADMIN) {
            log.warn("Blocked public signup with elevated role={}", requestedRole);
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }

        return requestedRole;
    }

    private void checkBruteForce(String email) {

        long failCount = loginAuditRepo.countByEmailAndSuccessFalseAndCreatedAtAfter(
                email,
                LocalDateTime.now().minusMinutes(BLOCK_MINUTES)
        );

        if (failCount >= MAX_FAILED_ATTEMPTS) {
            throw new BaseException(ErrorCode.ACCOUNT_LOCKED);
        }
    }

    private void upsertSession(User user, String deviceId, String ip, String agent) {

        sessionRepo.findByUserIdAndDeviceId(user.getId(), deviceId)
                .ifPresentOrElse(
                        session -> {
                            session.setLastActive(LocalDateTime.now());
                            session.setIpAddress(ip);
                            session.setUserAgent(agent);
                        },
                        () -> sessionRepo.save(Session.builder()
                                .user(user)
                                .deviceId(deviceId)
                                .ipAddress(ip)
                                .userAgent(agent)
                                .lastActive(LocalDateTime.now())
                                .build())
                );
    }

    private void upsertKnownDevice(User user, String deviceId, String ip, String agent) {

        knownDeviceRepo.findByUserIdAndDeviceId(user.getId(), deviceId)
                .ifPresentOrElse(
                        device -> {
                            device.setLastSeenAt(LocalDateTime.now());
                            device.setIpAddress(ip);
                            device.setUserAgent(agent);
                        },
                        () -> knownDeviceRepo.save(KnownDevice.builder()
                                .user(user)
                                .deviceId(deviceId)
                                .ipAddress(ip)
                                .userAgent(agent)
                                .lastSeenAt(LocalDateTime.now())
                                .build())
                );
    }
}
