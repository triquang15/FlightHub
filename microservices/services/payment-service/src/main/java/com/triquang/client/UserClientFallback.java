package com.triquang.client;

import org.springframework.stereotype.Component;

import com.triquang.dto.UserDTO;
import com.triquang.enums.ErrorCode;
import com.triquang.payload.response.ApiResponse;

@Component
public class UserClientFallback implements UserClient {

	@Override
	public ApiResponse<UserDTO> getUserByIdResponse(Long userId, String internalSecret) {
		return ApiResponse.error(ErrorCode.EXTERNAL_SERVICE_ERROR, "user-service-fallback");
	}
}
