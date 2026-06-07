package com.triquang.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.dto.UserDTO;
import com.triquang.enums.ErrorCode;
import com.triquang.enums.UserRole;
import com.triquang.exception.BaseException;
import com.triquang.kafka.SecurityEventProducer;
import com.triquang.mapper.UserMapper;
import com.triquang.message.PasswordResetRequestedEvent;
import com.triquang.model.User;
import com.triquang.payload.SessionDTO;
import com.triquang.payload.request.ChangePasswordRequest;
import com.triquang.payload.request.ResetPasswordRequest;
import com.triquang.payload.request.UpdateProfileRequest;
import com.triquang.repository.RefreshTokenRepository;
import com.triquang.repository.SessionRepository;
import com.triquang.repository.UserRepository;
import com.triquang.repository.UserPreferencesRepository;
import com.triquang.repository.KnownDeviceRepository;
import com.triquang.service.UserService;
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
    private final TokenHashUtil tokenHashUtil;
    private final SecurityEventProducer securityEventProducer;

    // ================= PROFILE =================
    @Override
    public UserDTO getUserById(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        return UserMapper.toDTO(user);
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

        return UserMapper.toDTO(user);
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

        userRepository.findByEmail(email).ifPresent(user -> {

            String rawToken = UUID.randomUUID().toString();
            String hash = tokenHashUtil.hash(rawToken);

            user.setResetTokenHash(hash);
            LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);
            user.setResetTokenExpiry(expiresAt);

            userRepository.save(user);

            securityEventProducer.sendPasswordResetRequestedEvent(PasswordResetRequestedEvent.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .resetToken(rawToken)
                    .expiresAt(expiresAt)
                    .requestedAt(LocalDateTime.now())
                    .build());

            log.info("Reset password token generated and notification queued for {}", email);
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

        return userRepository.findAll(spec, pageable).map(UserMapper::toDTO);
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
}
