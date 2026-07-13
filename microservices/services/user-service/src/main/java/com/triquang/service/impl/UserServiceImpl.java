package com.triquang.service.impl;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.triquang.dto.UserDTO;
import com.triquang.enums.ErrorCode;
import com.triquang.enums.UserRole;
import com.triquang.exception.BaseException;
import com.triquang.kafka.SecurityEventProducer;
import com.triquang.mapper.UserMapper;
import com.triquang.message.PasswordResetRequestedEvent;
import com.triquang.model.User;
import com.triquang.model.UserIdentity;
import com.triquang.payload.SessionDTO;
import com.triquang.payload.request.AdminCreateUserRequest;
import com.triquang.payload.request.ChangePasswordRequest;
import com.triquang.payload.request.ResetPasswordRequest;
import com.triquang.payload.request.UpdateProfileRequest;
import com.triquang.repository.RefreshTokenRepository;
import com.triquang.repository.SessionRepository;
import com.triquang.repository.UserRepository;
import com.triquang.repository.UserPreferencesRepository;
import com.triquang.repository.KnownDeviceRepository;
import com.triquang.repository.UserIdentityRepository;
import com.triquang.service.UserService;
import com.triquang.service.storage.AvatarStorageService;
import com.triquang.service.storage.AvatarStorageService.StoredAvatar;
import com.triquang.utils.TokenHashUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional 
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final RefreshTokenRepository refreshTokenRepo;
    private final SessionRepository sessionRepo;
    private final KnownDeviceRepository knownDeviceRepo;
    private final UserPreferencesRepository userPreferencesRepository;
    private final UserIdentityRepository userIdentityRepository;
    private final TokenHashUtil tokenHashUtil;
    private final SecurityEventProducer securityEventProducer;
    private final AvatarStorageService avatarStorageService;

    // ================= PROFILE =================
    @Override
    public UserDTO getUserById(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        return enrichLoginInfo(UserMapper.toDTO(user), userIdentityRepository.findByUserId(user.getId()));
    }

    // ================= UPDATE PROFILE =================
    @Override
    public UserDTO updateProfile(Long userId, UpdateProfileRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        userRepository.save(user);

        return enrichLoginInfo(UserMapper.toDTO(user), userIdentityRepository.findByUserId(user.getId()));
    }

    @Override
    public UserDTO updateAvatar(Long userId, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        String previousObjectKey = user.getAvatarObjectKey();
        StoredAvatar storedAvatar = avatarStorageService.store(userId, file);

        user.setAvatarUrl(storedAvatar.publicUrl());
        user.setAvatarObjectKey(storedAvatar.objectKey());
        user.setAvatarUpdatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        if (previousObjectKey != null && !previousObjectKey.equals(storedAvatar.objectKey())) {
            avatarStorageService.delete(previousObjectKey);
        }

        return enrichLoginInfo(UserMapper.toDTO(saved), userIdentityRepository.findByUserId(saved.getId()));
    }

    @Override
    public UserDTO deleteAvatar(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        String previousObjectKey = user.getAvatarObjectKey();
        user.setAvatarUrl(null);
        user.setAvatarObjectKey(null);
        user.setAvatarUpdatedAt(null);

        User saved = userRepository.save(user);
        avatarStorageService.delete(previousObjectKey);

        return enrichLoginInfo(UserMapper.toDTO(saved), userIdentityRepository.findByUserId(saved.getId()));
    }

    // ================= CHANGE PASSWORD =================
    @Override
    public void changePassword(Long userId, ChangePasswordRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BaseException(ErrorCode.INVALID_PASSWORD);
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BaseException(ErrorCode.SAME_PASSWORD);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));

        // 🔥 invalidate all sessions + tokens
        invalidateUserSessions(user);

        userRepository.save(user);

        log.info("Password changed for userId={}", userId);
    }

    // ================= FORGOT PASSWORD =================
    @Override
    public void forgotPassword(String email) {
        String normalizedEmail = normalizeEmail(email);

        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {

            String rawToken = UUID.randomUUID().toString();
            String hash = tokenHashUtil.hash(rawToken);

            user.setResetTokenHash(hash);
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);
            user.setResetTokenExpiry(expiresAt);

            userRepository.save(user);

            securityEventProducer.sendPasswordResetRequestedEvent(PasswordResetRequestedEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .userId(user.getId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .resetToken(rawToken)
                    .expiresAt(expiresAt)
                    .requestedAt(LocalDateTime.now())
                    .build());

            log.info("Reset password token generated and notification queued for {}", normalizedEmail);
        });
    }

    // ================= RESET PASSWORD =================
    @Override
    public void resetPassword(ResetPasswordRequest request) {

        String hash = tokenHashUtil.hash(request.getToken());

        User user = userRepository.findByResetTokenHash(hash)
                .orElseThrow(() -> new BaseException(ErrorCode.INVALID_TOKEN));

        if (user.getResetTokenExpiry() == null ||
                user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BaseException(ErrorCode.TOKEN_EXPIRED);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetTokenHash(null);
        user.setResetTokenExpiry(null);

        invalidateUserSessions(user);

        userRepository.save(user);

        log.info("Password reset success for {}", user.getEmail());
    }

    // ================= GET USERS =================
    @Override
    public Page<UserDTO> getUsers(Pageable pageable, String keyword, UserRole role) {
        String normalizedKeyword = keyword == null || keyword.isBlank() ? null : keyword.trim();
        Specification<User> spec = Specification.allOf();

        if (role != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("role"), role));
        }

        if (normalizedKeyword != null) {
            String pattern = "%" + normalizedKeyword.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("fullName")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(root.get("phone"), "%" + normalizedKeyword + "%")
            ));
        }

        Page<User> users = userRepository.findAll(spec, pageable);
        List<Long> userIds = users.getContent().stream()
                .map(User::getId)
                .toList();

        Map<Long, List<UserIdentity>> identitiesByUserId = userIds.isEmpty()
                ? Map.of()
                : userIdentityRepository.findByUserIdIn(userIds).stream()
                        .collect(Collectors.groupingBy(identity -> identity.getUser().getId()));

        return users.map(user -> enrichLoginInfo(
                UserMapper.toDTO(user),
                identitiesByUserId.getOrDefault(user.getId(), List.of())
        ));
    }

    @Override
    public UserDTO createUserByAdmin(AdminCreateUserRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (userRepository.findByEmail(email).isPresent()) {
            throw new BaseException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = User.builder()
                .fullName(trimToNull(request.getFullName()))
                .email(email)
                .phone(trimToNull(request.getPhone()))
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .verified(true)
                .active(true)
                .tokenVersion(0)
                .build();

        User saved = userRepository.save(user);
        log.info("Admin created user userId={} email={} role={}", saved.getId(), saved.getEmail(), saved.getRole());

        userIdentityRepository.save(UserIdentity.builder()
                .user(saved)
                .provider(com.triquang.enums.AuthProvider.PASSWORD)
                .providerUserId(email)
                .providerEmail(email)
                .displayName(saved.getFullName())
                .lastLoginAt(null)
                .build());

        return enrichLoginInfo(UserMapper.toDTO(saved), userIdentityRepository.findByUserId(saved.getId()));
    }

    // ================= DELETE USER =================
    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        if (user.getRole() == UserRole.ROLE_SYSTEM_ADMIN) {
            throw new BaseException(ErrorCode.SYSTEM_ADMIN_DELETE_FORBIDDEN);
        }

        refreshTokenRepo.deleteByUserId(id);
        sessionRepo.deleteByUserId(id);
        knownDeviceRepo.deleteByUserId(id);
        userPreferencesRepository.deleteByUserId(id);
        userRepository.delete(user);

        log.info("User deleted userId={} email={} role={}", id, user.getEmail(), user.getRole());
    }

    // ================= SESSIONS =================
    @Override
    public List<SessionDTO> getUserSessions(Long userId) {

        return sessionRepo.findByUserId(userId).stream().map(session -> {
            SessionDTO dto = new SessionDTO();
            dto.setDeviceId(session.getDeviceId());
            dto.setIpAddress(session.getIpAddress());
            dto.setUserAgent(session.getUserAgent());
            dto.setLastActive(session.getLastActive());
            return dto;
        }).toList();
    }

    @Override
    public void logoutDevice(Long userId, String deviceId) {

        sessionRepo.deleteByUserIdAndDeviceId(userId, deviceId);
        refreshTokenRepo.revokeByUserIdAndDeviceId(userId, deviceId);
    }

    @Override
    public void logoutAll(Long userId) {

        refreshTokenRepo.revokeAllByUserId(userId);
        sessionRepo.deleteByUserId(userId);
    }

    // ================= HELPER =================
    private void invalidateUserSessions(User user) {

        user.setTokenVersion(user.getTokenVersion() + 1);

        refreshTokenRepo.revokeAllByUserId(user.getId());
        sessionRepo.deleteByUserId(user.getId());
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

    private UserDTO enrichLoginInfo(UserDTO dto, List<UserIdentity> identities) {
        if (dto == null) {
            return null;
        }

        List<UserIdentity> safeIdentities = identities == null ? List.of() : identities;

        dto.setLoginProviders(safeIdentities.stream()
                .map(UserIdentity::getProvider)
                .distinct()
                .toList());

        safeIdentities.stream()
                .filter(identity -> identity.getLastLoginAt() != null)
                .max(Comparator.comparing(UserIdentity::getLastLoginAt))
                .ifPresent(identity -> {
                    dto.setLastLoginProvider(identity.getProvider());
                    dto.setLastProviderLoginAt(identity.getLastLoginAt());
                });

        if (dto.getAvatarUrl() == null) {
            safeIdentities.stream()
                    .map(UserIdentity::getAvatarUrl)
                    .filter(value -> value != null && !value.isBlank())
                    .findFirst()
                    .ifPresent(value -> {
                        dto.setAvatarUrl(value);
                        dto.setProfilePicture(value);
                    });
        }

        return dto;
    }
}
