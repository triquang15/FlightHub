package com.triquang.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.triquang.dto.UserDTO;

@FeignClient(name = "user-service", fallback = UserClientFallback.class)
public interface UserClient {

	@GetMapping("/api/users/{userId}")
	UserDTO getUserById(@PathVariable Long userId);
}
