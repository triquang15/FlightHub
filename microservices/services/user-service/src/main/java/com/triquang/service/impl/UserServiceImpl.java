package com.triquang.service.impl;

import com.triquang.dto.UserDTO;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.UserMapper;
import com.triquang.model.User;
import com.triquang.repository.UserRepository;
import com.triquang.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

	private final UserRepository userRepository;

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
	public Page<UserDTO> getUsers(Pageable pageable) {

		log.info("Fetching users with pageable={}", pageable);

		return userRepository.findAll(pageable).map(UserMapper::toDTO);
	}
}