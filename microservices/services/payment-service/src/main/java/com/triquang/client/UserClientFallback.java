package com.triquang.client;

import org.springframework.stereotype.Component;

import com.triquang.dto.UserDTO;

@Component
public class UserClientFallback implements UserClient {

	@Override
	public UserDTO getUserById(Long userId) {
		return null;
	}
}
