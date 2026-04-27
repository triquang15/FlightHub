package com.triquang.exception;

import com.triquang.enums.ErrorCode;
import com.triquang.payload.response.ApiResponse;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

/**
 * Global exception handler to catch and handle exceptions across the application. It
 * provides standardized error responses and logs exceptions with trace IDs for better
 * debugging and monitoring.
 *
 * @author Tri Quang
 */

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	private String traceId() {
	    return MDC.get("traceId") != null ? MDC.get("traceId") : "N/A";
	}

	// BUSINESS
	@ExceptionHandler(BaseException.class)
	public ResponseEntity<ApiResponse<?>> handleBaseException(BaseException ex) {

		log.warn("Business exception: code={}, traceId={}", ex.getErrorCode().getCode(), traceId());

		return ResponseEntity.status(ex.getErrorCode().getStatus())
				.body(ApiResponse.error(ex.getErrorCode(), traceId()));
	}

	// VALIDATION
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiResponse<?>> handleValidationException(MethodArgumentNotValidException ex) {

		String message = ex.getBindingResult().getFieldErrors().stream().findFirst()
				.map(e -> e.getField() + " " + e.getDefaultMessage()).orElse("Validation error");

		log.warn("Validation failed: {} | traceId={}", message, traceId());

		return ResponseEntity.badRequest().body(new ApiResponse<>(400, ErrorCode.INVALID_INPUT.getCode(), message, null,
				traceId(), java.time.Instant.now()));
	}

	// SYSTEM
	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiResponse<?>> handleSystemException(Exception ex) {

		log.error("System exception | traceId={}", traceId(), ex);

		return ResponseEntity.status(ErrorCode.INTERNAL_ERROR.getStatus())
				.body(ApiResponse.error(ErrorCode.INTERNAL_ERROR, traceId()));
	}
}