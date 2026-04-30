package com.triquang.exception;

import com.triquang.enums.ErrorCode;
import com.triquang.payload.response.ApiResponse;

import lombok.extern.slf4j.Slf4j;

import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private String traceId() {
        return java.util.Optional.ofNullable(MDC.get("traceId")).orElse("N/A");
    }

    private String path(HttpServletRequest request) {
        return request != null ? request.getRequestURI() : "N/A";
    }

    // =========================
    // BUSINESS
    // =========================
    @ExceptionHandler(BaseException.class)
    public ResponseEntity<ApiResponse<?>> handleBaseException(BaseException ex, HttpServletRequest request) {

        log.warn("Business exception | code={} | path={} | traceId={}",
                ex.getErrorCode().getCode(),
                path(request),
                traceId());

        return ResponseEntity
                .status(ex.getErrorCode().getStatus())
                .body(ApiResponse.error(ex.getErrorCode(), traceId()));
    }

    // =========================
    // VALIDATION
    // =========================
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(e -> e.getField() + " " + e.getDefaultMessage())
                .orElse("Validation error");

        log.info("Validation failed | message={} | path={} | traceId={}",
                message,
                path(request),
                traceId());

        return ResponseEntity
                .status(ErrorCode.INVALID_INPUT.getStatus())
                .body(ApiResponse.error(ErrorCode.INVALID_INPUT, message, traceId()));
    }

    // =========================
    // ILLEGAL ARGUMENT
    // =========================
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<?>> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request) {

        log.warn("Illegal argument | message={} | path={} | traceId={}",
                ex.getMessage(),
                path(request),
                traceId());

        return ResponseEntity
                .status(ErrorCode.INVALID_INPUT.getStatus())
                .body(ApiResponse.error(ErrorCode.INVALID_INPUT, ex.getMessage(), traceId()));
    }

    // =========================
    // SECURITY / HTTP ERRORS
    // =========================
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<?>> handleResponseStatusException(
            ResponseStatusException ex,
            HttpServletRequest request) {

        int status = ex.getStatusCode().value();

        ErrorCode errorCode;
        switch (status) {
            case 401 -> errorCode = ErrorCode.UNAUTHORIZED;
            case 403 -> errorCode = ErrorCode.FORBIDDEN;
            case 429 -> errorCode = ErrorCode.TOO_MANY_REQUESTS;
            case 404 -> errorCode = ErrorCode.NOT_FOUND;
            default -> errorCode = ErrorCode.INTERNAL_ERROR;
        }

        log.warn("HTTP error | status={} | path={} | traceId={}",
                status,
                path(request),
                traceId());

        return ResponseEntity
                .status(status)
                .body(ApiResponse.error(errorCode, traceId()));
    }

    // =========================
    // SYSTEM
    // =========================
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleSystemException(
            Exception ex,
            HttpServletRequest request) {

        log.error("System exception | path={} | traceId={}",
                path(request),
                traceId(),
                ex);

        return ResponseEntity
                .status(ErrorCode.INTERNAL_ERROR.getStatus())
                .body(ApiResponse.error(ErrorCode.INTERNAL_ERROR, traceId()));
    }
}