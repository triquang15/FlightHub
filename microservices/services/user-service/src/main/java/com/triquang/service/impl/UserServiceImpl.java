package com.triquang.service.impl;

import com.triquang.dto.UserDTO;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.UserMapper;
import com.triquang.model.User;
import com.triquang.payload.request.ChangePasswordRequest;
import com.triquang.payload.request.ResetPasswordRequest;
import com.triquang.repository.UserRepository;
import com.triquang.service.UserService;
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

	@Override
	public UserDTO getUserProfile(String email) {

		if (email == null || email.isBlank()) {
			throw new BaseException(ErrorCode.INVALID_INPUT);
		}

		log.info("Fetching user profile for email={}", email);

		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

		return UserMapper.toDTO(user);
	}

	@Override
	public UserDTO getUserById(Long id) {

		if (id == null || id <= 0) {
			throw new BaseException(ErrorCode.INVALID_INPUT);
		}

		log.info("Fetching user by id={}", id);

		User user = userRepository.findById(id).orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

		return UserMapper.toDTO(user);
	}
	
	@Override
	public void changePassword(String email, ChangePasswordRequest request) {

	    User user = userRepository.findByEmail(email)
	            .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

	    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
	        throw new BaseException(ErrorCode.INVALID_PASSWORD);
	    }

	    user.setPassword(passwordEncoder.encode(request.getNewPassword()));

	    userRepository.save(user);

	    log.info("Password changed for {}", email);
	}

	@Override
	public Page<UserDTO> getUsers(Pageable pageable) {

		log.info("Fetching users with pageable={}", pageable);

		return userRepository.findAll(pageable).map(UserMapper::toDTO);
	}

	@Override
	public void forgotPassword(String email) {

	    User user = userRepository.findByEmail(email)
	            .orElseThrow(() -> new BaseException(ErrorCode.USER_NOT_FOUND));

	    String token = UUID.randomUUID().toString();

	    user.setResetToken(token);
	    user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));

	    userRepository.save(user);

	    // TODO: send email
	    log.info("Reset token for {} = {}", email, token);
	}

	@Override
	public void resetPassword(ResetPasswordRequest request) {

	    User user = userRepository.findByResetToken(request.getToken())
	            .orElseThrow(() -> new BaseException(ErrorCode.INVALID_TOKEN));

	    if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
	        throw new BaseException(ErrorCode.TOKEN_EXPIRED);
	    }

	    user.setPassword(passwordEncoder.encode(request.getNewPassword()));

	    user.setResetToken(null);
	    user.setResetTokenExpiry(null);

	    userRepository.save(user);

	    log.info("Password reset success for {}", user.getEmail());
	}
}