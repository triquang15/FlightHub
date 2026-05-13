package com.triquang.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.dto.UserDTO;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.UserMapper;
import com.triquang.model.User;
import com.triquang.payload.SessionDTO;
import com.triquang.payload.request.ChangePasswordRequest;
import com.triquang.payload.request.ResetPasswordRequest;
import com.triquang.payload.request.UpdateProfileRequest;
import com.triquang.repository.RefreshTokenRepository;
import com.triquang.repository.SessionRepository;
import com.triquang.repository.UserRepository;
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
    private final TokenHashUtil tokenHashUtil;

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
            user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));

            userRepository.save(user);

            // TODO: send email with rawToken
            log.info("Reset password token generated for {}", email);
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
    public Page<UserDTO> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(UserMapper::toDTO);
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