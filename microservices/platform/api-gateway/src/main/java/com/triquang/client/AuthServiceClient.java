package com.triquang.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import com.triquang.config.JwtConstant;
import com.triquang.payload.request.RefreshTokenRequest;

@FeignClient(
        contextId = "authServiceClient",
        name = "user-service",
        path = "/api/auth"
)
public interface AuthServiceClient {

    @PostMapping("/logout")
    Object logout(
            @RequestHeader(JwtConstant.JWT_HEADER) String authorization,
            @RequestHeader("X-Device-Id") String deviceId,
            @RequestBody RefreshTokenRequest request
    );
}
