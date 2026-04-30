package com.triquang.payload.response;

import java.time.Instant;

import com.triquang.enums.ErrorCode;

/**
 * Standardized API response structure for all endpoints.
 * <p>
 * This class provides factory methods to create consistent responses for success and error cases.
 * Each response includes a trace ID for better logging and debugging.
 *
 * @param <T> The type of the data payload in the response.
 * @author Tri Quang
 */

public record ApiResponse<T>(
        int status,
        String errorCode,
        String message,
        T data,
        String traceId,
        Instant timestamp
) {

    // ---------- SUCCESS ----------
    public static <T> ApiResponse<T> success(T data, String traceId) {
        return new ApiResponse<>(
                200,
                null,
                "SUCCESS",
                data,
                traceId,
                Instant.now()
        );
    }

    // ---------- SUCCESS WITH CUSTOM MESSAGE ----------
    public static <T> ApiResponse<T> success(T data, String message, String traceId) {
        return new ApiResponse<>(
                200,
                null,
                message,
                data,
                traceId,
                Instant.now()
        );
    }

    // ---------- CREATED ----------
    public static <T> ApiResponse<T> created(T data, String traceId) {
        return new ApiResponse<>(
                201,
                null,
                "CREATED",
                data,
                traceId,
                Instant.now()
        );
    }

    // ---------- NO CONTENT ----------
    public static ApiResponse<Void> noContent(String traceId) {
        return new ApiResponse<>(
                204,
                null,
                "NO CONTENT",
                null,
                traceId,
                Instant.now()
        );
    }

 // ---------- ERROR (DEFAULT MESSAGE) ----------
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

    // ---------- ERROR (CUSTOM MESSAGE) ----------
    public static <T> ApiResponse<T> error(ErrorCode errorCode, String message, String traceId) {
        return new ApiResponse<>(
                errorCode.getStatus().value(),
                errorCode.getCode(),
                message,
                null,
                traceId,
                Instant.now()
        );
    }
}