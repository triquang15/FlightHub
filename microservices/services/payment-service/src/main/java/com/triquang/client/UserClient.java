package com.triquang.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import com.triquang.dto.UserDTO;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.payload.response.ApiResponse;

@FeignClient(name = "user-service", fallback = UserClientFallback.class)
public interface UserClient {

	String INTERNAL_SECRET_HEADER = "X-Internal-Secret";

	@GetMapping("/api/internal/users/{userId}")
	ApiResponse<UserDTO> getUserByIdResponse(
			@PathVariable Long userId,
			@RequestHeader(INTERNAL_SECRET_HEADER) String internalSecret
	);

	default UserDTO getUserById(Long userId, String internalSecret) {
		ApiResponse<UserDTO> response = getUserByIdResponse(userId, internalSecret);
		if (response == null || response.data() == null) {
			throw new BaseException(ErrorCode.EXTERNAL_SERVICE_ERROR);
		}
		return response.data();
	}
}
