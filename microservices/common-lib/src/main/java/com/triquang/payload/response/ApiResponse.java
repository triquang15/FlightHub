package com.triquang.payload.response;

import java.time.Instant;

import com.triquang.enums.ErrorCode;

public record ApiResponse<T>(
        int status,
        String errorCode,
        String message,
        T data,
        String traceId,
        Instant timestamp
) {

    public static <T> ApiResponse<T> success(T data, String traceId) {
        return new ApiResponse<>(
                200,
                null,
                "Success",
                data,
                traceId,
                Instant.now()
        );
    }

    public static <T> ApiResponse<T> error(ErrorCode errorCode, String traceId) {
        return new ApiResponse<>(
                errorCode.getStatus().value(),
                errorCode.getCode(),
                errorCode.getMessage(),
                null,
                traceId,
                Instant.now()
        );
    }
}