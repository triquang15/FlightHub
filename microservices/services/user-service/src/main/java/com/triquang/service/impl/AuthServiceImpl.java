package com.triquang.service.impl;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.config.JwtProvider;
import com.triquang.enums.AuthProvider;
import com.triquang.enums.ErrorCode;
import com.triquang.enums.UserRole;
import com.triquang.exception.BaseException;
import com.triquang.mapper.UserMapper;
import com.triquang.model.KnownDevice;
import com.triquang.model.RefreshToken;
import com.triquang.model.Session;
import com.triquang.model.User;
import com.triquang.model.UserIdentity;
import com.triquang.model.UserPreferences;
import com.triquang.payload.request.SignupRequest;
import com.triquang.payload.response.AuthResponse;
import com.triquang.repository.LoginAuditRepository;
import com.triquang.repository.KnownDeviceRepository;
import com.triquang.repository.RefreshTokenRepository;
import com.triquang.repository.SessionRepository;
import com.triquang.repository.UserIdentityRepository;
import com.triquang.repository.UserRepository;
import com.triquang.repository.UserPreferencesRepository;
import com.triquang.service.AppleIdentityService;
import com.triquang.service.AuthService;
import com.triquang.service.FacebookIdentityService;
import com.triquang.service.GoogleIdentityService;
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
    private final UserIdentityRepository userIdentityRepository;

    private final JwtProvider jwtProvider;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService customUserDetailsService;
    private final TokenHashUtil tokenHashUtil;
    private final SuspiciousLoginService suspiciousLoginService;
    private final AppleIdentityService appleIdentityService;
    private final FacebookIdentityService facebookIdentityService;
    private final GoogleIdentityService googleIdentityService;
    private final PasswordEncoder passwordEncoder;

    private final AuditService auditService;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int BLOCK_MINUTES = 5;

    // ================= SIGNUP =================
    @Override
    public AuthResponse signup(SignupRequest req, String ip, String agent) {
        String email = normalizeEmail(req.getEmail());

        if (userRepository.findByEmail(email).isPresent()) {
            throw new BaseException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        String deviceId = normalizeDeviceId(req.getDeviceId());

        UserRole userRole = resolveSignupRole(req.getRole());

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(trimToNull(req.getFullName()))
                .phone(trimToNull(req.getPhone()))
                .role(userRole)
                .verified(true)
                .active(true)
                .build();

        userRepository.save(user);
        userPreferencesRepository.save(UserPreferences.builder()
                .user(user)
                .build());
        upsertUserIdentity(
                user,
                AuthProvider.PASSWORD,
                email,
                email,
                user.getFullName(),
                null
        );

        upsertKnownDevice(user, deviceId, ip, agent);
        upsertSession(user, deviceId, ip, agent);

        return buildAuthResponse(user, deviceId, ip, agent);
    }

    // ================= LOGIN =================
    @Override
    public AuthResponse login(String email, String password,
                             String deviceId, String ip, String agent) {

        String normalizedEmail = normalizeEmail(email);
        String normalizedDeviceId = normalizeDeviceId(deviceId);
        
        checkBruteForce(normalizedEmail);

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, password)
            );

            User user = userRepository.findByEmail(normalizedEmail)
                    .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

            if (!user.isActive()) throw new BaseException(ErrorCode.ACCOUNT_DISABLED);
            if (!user.isVerified()) throw new BaseException(ErrorCode.EMAIL_NOT_VERIFIED);

            boolean suspicious = suspiciousLoginService.isSuspicious(
                    user.getId(), normalizedEmail, normalizedDeviceId, ip
            );

            if (suspicious) {
                suspiciousLoginService.handleSuspicious(
                        user.getId(), normalizedEmail, normalizedDeviceId, ip
                );
            }

            user.setLastLogin(LocalDateTime.now());
            upsertUserIdentity(
                    user,
                    AuthProvider.PASSWORD,
                    normalizedEmail,
                    normalizedEmail,
                    user.getFullName(),
                    null
            );

            auditService.saveLoginAudit(normalizedEmail, true, AuthProvider.PASSWORD, ip, agent);

            upsertKnownDevice(user, normalizedDeviceId, ip, agent);
            upsertSession(user, normalizedDeviceId, ip, agent);

            return buildAuthResponse(user, normalizedDeviceId, ip, agent);

        } catch (BaseException ex) {
            throw ex;
        } catch (Exception ex) {

            auditService.saveLoginAudit(normalizedEmail, false, AuthProvider.PASSWORD, ip, agent);

            checkBruteForce(normalizedEmail);

            throw new BaseException(ErrorCode.INVALID_CREDENTIALS);
        }
    }

    // ================= GOOGLE LOGIN =================
    @Override
    public AuthResponse loginWithGoogle(String idToken,
                                        String deviceId, String ip, String agent) {

        String normalizedDeviceId = normalizeDeviceId(deviceId);
        GoogleIdentityService.GoogleIdentity identity = googleIdentityService.verify(idToken);
        String normalizedEmail = normalizeEmail(identity.email());

        User user = userIdentityRepository
                .findByProviderAndProviderUserId(AuthProvider.GOOGLE, identity.subject())
                .map(UserIdentity::getUser)
                .orElseGet(() -> userRepository.findByEmail(normalizedEmail)
                        .map(existing -> {
                            if (!existing.isActive()) throw new BaseException(ErrorCode.ACCOUNT_DISABLED);
                            if (!existing.isVerified()) existing.setVerified(true);
                            if (trimToNull(existing.getFullName()) == null && trimToNull(identity.name()) != null) {
                                existing.setFullName(trimToNull(identity.name()));
                            }
                            return existing;
                        })
                        .orElseGet(() -> {
                    User createdUser = User.builder()
                            .email(normalizedEmail)
                            .password(passwordEncoder.encode("GOOGLE_AUTH_" + UUID.randomUUID()))
                            .fullName(resolveGoogleName(identity, normalizedEmail))
                            .role(UserRole.ROLE_CUSTOMER)
                            .verified(true)
                            .active(true)
                            .build();

                    User saved = userRepository.save(createdUser);
                    userPreferencesRepository.save(UserPreferences.builder()
                            .user(saved)
                            .build());
                    return saved;
                }));

        if (!user.isActive()) throw new BaseException(ErrorCode.ACCOUNT_DISABLED);

        upsertUserIdentity(
                user,
                AuthProvider.GOOGLE,
                identity.subject(),
                normalizedEmail,
                identity.name(),
                identity.picture()
        );

        boolean suspicious = suspiciousLoginService.isSuspicious(
                user.getId(), normalizedEmail, normalizedDeviceId, ip
        );

        if (suspicious) {
            suspiciousLoginService.handleSuspicious(
                    user.getId(), normalizedEmail, normalizedDeviceId, ip
            );
        }

        user.setLastLogin(LocalDateTime.now());
        auditService.saveLoginAudit(normalizedEmail, true, AuthProvider.GOOGLE, ip, agent);

        upsertKnownDevice(user, normalizedDeviceId, ip, agent);
        upsertSession(user, normalizedDeviceId, ip, agent);

        return buildAuthResponse(user, normalizedDeviceId, ip, agent);
    }

    // ================= FACEBOOK LOGIN =================
    @Override
    public AuthResponse loginWithFacebook(String accessToken,
                                          String deviceId, String ip, String agent) {

        String normalizedDeviceId = normalizeDeviceId(deviceId);
        FacebookIdentityService.FacebookIdentity identity = facebookIdentityService.verify(accessToken);
        String normalizedEmail = normalizeEmail(identity.email());

        User user = userIdentityRepository
                .findByProviderAndProviderUserId(AuthProvider.FACEBOOK, identity.subject())
                .map(UserIdentity::getUser)
                .orElseGet(() -> userRepository.findByEmail(normalizedEmail)
                        .map(existing -> {
                            if (!existing.isActive()) throw new BaseException(ErrorCode.ACCOUNT_DISABLED);
                            if (!existing.isVerified()) existing.setVerified(true);
                            if (trimToNull(existing.getFullName()) == null && trimToNull(identity.name()) != null) {
                                existing.setFullName(trimToNull(identity.name()));
                            }
                            return existing;
                        })
                        .orElseGet(() -> {
                            User createdUser = User.builder()
                                    .email(normalizedEmail)
                                    .password(passwordEncoder.encode("FACEBOOK_AUTH_" + UUID.randomUUID()))
                                    .fullName(resolveFacebookName(identity, normalizedEmail))
                                    .role(UserRole.ROLE_CUSTOMER)
                                    .verified(true)
                                    .active(true)
                                    .build();

                            User saved = userRepository.save(createdUser);
                            userPreferencesRepository.save(UserPreferences.builder()
                                    .user(saved)
                                    .build());
                            return saved;
                        }));

        if (!user.isActive()) throw new BaseException(ErrorCode.ACCOUNT_DISABLED);

        upsertUserIdentity(
                user,
                AuthProvider.FACEBOOK,
                identity.subject(),
                normalizedEmail,
                identity.name(),
                identity.picture()
        );

        boolean suspicious = suspiciousLoginService.isSuspicious(
                user.getId(), normalizedEmail, normalizedDeviceId, ip
        );

        if (suspicious) {
            suspiciousLoginService.handleSuspicious(
                    user.getId(), normalizedEmail, normalizedDeviceId, ip
            );
        }

        user.setLastLogin(LocalDateTime.now());
        auditService.saveLoginAudit(normalizedEmail, true, AuthProvider.FACEBOOK, ip, agent);

        upsertKnownDevice(user, normalizedDeviceId, ip, agent);
        upsertSession(user, normalizedDeviceId, ip, agent);

        return buildAuthResponse(user, normalizedDeviceId, ip, agent);
    }

    // ================= APPLE LOGIN =================
    @Override
    public AuthResponse loginWithApple(String idToken, String fullName,
                                       String deviceId, String ip, String agent) {

        String normalizedDeviceId = normalizeDeviceId(deviceId);
        AppleIdentityService.AppleIdentity identity = appleIdentityService.verify(idToken, fullName);

        User user = userIdentityRepository
                .findByProviderAndProviderUserId(AuthProvider.APPLE, identity.subject())
                .map(UserIdentity::getUser)
                .orElseGet(() -> {
                    String normalizedEmail = normalizeEmail(identity.email());
                    if (trimToNull(normalizedEmail) == null) {
                        log.warn("Apple login subject={} did not include email and is not linked", identity.subject());
                        throw new BaseException(ErrorCode.EMAIL_NOT_VERIFIED);
                    }

                    return userRepository.findByEmail(normalizedEmail)
                            .map(existing -> {
                                if (!existing.isActive()) throw new BaseException(ErrorCode.ACCOUNT_DISABLED);
                                if (!existing.isVerified()) existing.setVerified(true);
                                if (trimToNull(existing.getFullName()) == null && trimToNull(identity.fullName()) != null) {
                                    existing.setFullName(trimToNull(identity.fullName()));
                                }
                                return existing;
                            })
                            .orElseGet(() -> {
                                User createdUser = User.builder()
                                        .email(normalizedEmail)
                                        .password(passwordEncoder.encode("APPLE_AUTH_" + UUID.randomUUID()))
                                        .fullName(resolveAppleName(identity, normalizedEmail))
                                        .role(UserRole.ROLE_CUSTOMER)
                                        .verified(true)
                                        .active(true)
                                        .build();

                                User saved = userRepository.save(createdUser);
                                userPreferencesRepository.save(UserPreferences.builder()
                                        .user(saved)
                                        .build());
                                return saved;
                            });
                });

        if (!user.isActive()) throw new BaseException(ErrorCode.ACCOUNT_DISABLED);

        String auditEmail = normalizeEmail(identity.email());
        if (trimToNull(auditEmail) == null) {
            auditEmail = user.getEmail();
        }

        upsertUserIdentity(
                user,
                AuthProvider.APPLE,
                identity.subject(),
                auditEmail,
                identity.fullName(),
                null
        );

        boolean suspicious = suspiciousLoginService.isSuspicious(
                user.getId(), auditEmail, normalizedDeviceId, ip
        );

        if (suspicious) {
            suspiciousLoginService.handleSuspicious(
                    user.getId(), auditEmail, normalizedDeviceId, ip
            );
        }

        user.setLastLogin(LocalDateTime.now());
        auditService.saveLoginAudit(auditEmail, true, AuthProvider.APPLE, ip, agent);

        upsertKnownDevice(user, normalizedDeviceId, ip, agent);
        upsertSession(user, normalizedDeviceId, ip, agent);

        return buildAuthResponse(user, normalizedDeviceId, ip, agent);
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
        if (requestedRole != null && requestedRole != UserRole.ROLE_CUSTOMER) {
            log.warn("Blocked public signup with elevated role={}", requestedRole);
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }

        return UserRole.ROLE_CUSTOMER;
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

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String resolveGoogleName(GoogleIdentityService.GoogleIdentity identity, String email) {
        String name = trimToNull(identity.name());
        if (name != null) {
            return name;
        }

        int atIndex = email.indexOf('@');
        if (atIndex > 0) {
            return email.substring(0, atIndex);
        }

        return email;
    }

    private String resolveAppleName(AppleIdentityService.AppleIdentity identity, String email) {
        String name = trimToNull(identity.fullName());
        if (name != null) {
            return name;
        }

        int atIndex = email.indexOf('@');
        if (atIndex > 0) {
            return email.substring(0, atIndex);
        }

        return email;
    }

    private String resolveFacebookName(FacebookIdentityService.FacebookIdentity identity, String email) {
        String name = trimToNull(identity.name());
        if (name != null) {
            return name;
        }

        int atIndex = email.indexOf('@');
        if (atIndex > 0) {
            return email.substring(0, atIndex);
        }

        return email;
    }

    private void upsertUserIdentity(
            User user,
            AuthProvider provider,
            String providerUserId,
            String providerEmail,
            String displayName,
            String avatarUrl
    ) {
        userIdentityRepository
                .findByProviderAndProviderUserId(provider, providerUserId)
                .ifPresentOrElse(
                        identity -> {
                            identity.setUser(user);
                            identity.setProviderEmail(trimToNull(providerEmail));
                            identity.setDisplayName(trimToNull(displayName));
                            identity.setAvatarUrl(trimToNull(avatarUrl));
                            identity.setLastLoginAt(LocalDateTime.now());
                        },
                        () -> userIdentityRepository.save(UserIdentity.builder()
                                .user(user)
                                .provider(provider)
                                .providerUserId(providerUserId)
                                .providerEmail(trimToNull(providerEmail))
                                .displayName(trimToNull(displayName))
                                .avatarUrl(trimToNull(avatarUrl))
                                .lastLoginAt(LocalDateTime.now())
                                .build())
                );
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
