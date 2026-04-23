package com.triquang.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.triquang.exception.UserException;
import com.triquang.model.User;
import com.triquang.repository.UserRepository;
import com.triquang.service.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

	private final UserRepository userRepository;

	@Override
	public User getUserByEmail(String email) throws UserException {
		User user = userRepository.findByEmail(email);
		if (user == null) {
			throw new UserException("User not found with email: " + email);
		}
		return user;
	}

	@Override
	public User getUserById(Long id) throws UserException {
		return userRepository.findById(id).orElseThrow(() -> new UserException("User not found with id: " + id));
	}

	@Override
	public List<User> getUsers() throws UserException {
		return userRepository.findAll();
	}
}
