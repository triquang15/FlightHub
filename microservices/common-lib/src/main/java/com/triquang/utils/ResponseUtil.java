package com.triquang.utils;

import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;

import com.triquang.config.TraceIdFilter;
import com.triquang.enums.ErrorCode;
import com.triquang.payload.response.ApiResponse;

/**
 * Utility class for creating standardized API responses. This ensures that all
 * responses have a consistent structure and include the trace ID for better
 * logging and debugging.
 *
 * @author Tri Quang
 */

public class ResponseUtil {

    private ResponseUtil() {}

    private static String traceId() {
        String traceId = MDC.get(TraceIdFilter.TRACE_ID);
        return traceId != null ? traceId : "N/A";
    }

    public static <T> ResponseEntity<ApiResponse<T>> ok(T data) {
        return ResponseEntity.ok(
                ApiResponse.success(data, traceId())
        );
    }

    public static <T> ResponseEntity<ApiResponse<T>> created(T data) {
        return ResponseEntity.status(201).body(
                ApiResponse.success(data, traceId())
        );
    }

    public static ResponseEntity<Void> noContent() {
        return ResponseEntity.noContent().build();
    }

    public static ResponseEntity<ApiResponse<Void>> error(ErrorCode errorCode) {
        return ResponseEntity
                .status(errorCode.getStatus())
                .body(ApiResponse.error(errorCode, traceId()));
    }
}