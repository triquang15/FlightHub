package com.triquang.service.impl;

import com.triquang.dto.UserDTO;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.UserMapper;
import com.triquang.model.User;
import com.triquang.payload.request.ChangePasswordRequest;
import com.triquang.payload.request.ResetPasswordRequest;
import com.triquang.repository.RefreshTokenRepository;
import com.triquang.repository.SessionRepository;
import com.triquang.repository.UserRepository;
import com.triquang.service.UserService;
import com.triquang.utils.TokenHashUtil;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final RefreshTokenRepository refreshTokenRepo;
    private final SessionRepository sessionRepo;
    private final TokenHashUtil tokenHashUtil;

    // ================= PROFILE =================
    @Override
    public UserDTO getUserProfile(String email) {

        if (email == null || email.isBlank()) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        return UserMapper.toDTO(user);
    }

    @Override
    public UserDTO getUserById(Long id) {

        if (id == null || id <= 0) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        return UserMapper.toDTO(user);
    }

    @Override
    public Page<UserDTO> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(UserMapper::toDTO);
    }

    // ================= CHANGE PASSWORD =================
    @Override
    public void changePassword(String email, ChangePasswordRequest request) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BaseException(ErrorCode.INVALID_PASSWORD);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));

        // 🔥 invalidate all sessions + tokens
        invalidateUserSessions(user.getId());

        userRepository.save(user);

        log.info("Password changed for {}", email);
    }

    // ================= FORGOT PASSWORD =================
    @Override
    public void forgotPassword(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

        String rawToken = UUID.randomUUID().toString();

        String hash = tokenHashUtil.hash(rawToken);

        user.setResetTokenHash(hash);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));

        userRepository.save(user);

        // TODO: send email with rawToken (NOT hash)
        log.info("Reset password token generated for {}", email);
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

        // 🔥 clear token
        user.setResetTokenHash(null);
        user.setResetTokenExpiry(null);

        // 🔥 revoke all sessions
        invalidateUserSessions(user.getId());

        userRepository.save(user);

        log.info("Password reset success for {}", user.getEmail());
    }

    // ================= HELPER =================
    private void invalidateUserSessions(Long userId) {

        refreshTokenRepo.revokeAllByUserId(userId);
        sessionRepo.deleteByUserId(userId);
    }
}