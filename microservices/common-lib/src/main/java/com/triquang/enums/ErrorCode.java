package com.triquang.enums;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // =========================
    // COMMON
    // =========================
    INTERNAL_ERROR("SYS_001", "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_INPUT("SYS_002", "Invalid input", HttpStatus.BAD_REQUEST),

    // =========================
    // USER
    // =========================
    USER_NOT_FOUND("USR_001", "User not found", HttpStatus.NOT_FOUND),
    INVALID_USER_INPUT("USR_002", "Invalid user input", HttpStatus.BAD_REQUEST),
    EMAIL_ALREADY_EXISTS("USR_003", "Email already registered", HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS("USR_004", "Invalid credentials", HttpStatus.UNAUTHORIZED),

    // =========================
    // AUTH
    // =========================
    INVALID_TOKEN("AUTH_001", "Invalid token", HttpStatus.UNAUTHORIZED),
    INVALID_REFRESH_TOKEN("AUTH_002", "Not a refresh token", HttpStatus.UNAUTHORIZED),

    // =========================
    // AIRPORT
    // =========================
    AIRPORT_NOT_FOUND("APT_001", "Airport not found", HttpStatus.NOT_FOUND),
    AIRPORT_ALREADY_EXISTS("APT_002", "Airport already exists", HttpStatus.BAD_REQUEST),

    // =========================
    // CITY
    // =========================
    CITY_NOT_FOUND("CITY_001", "City not found", HttpStatus.NOT_FOUND),
    CITY_ALREADY_EXISTS("CITY_002", "City already exists", HttpStatus.BAD_REQUEST),
    INVALID_CITY_CODE("CITY_003", "Invalid city code format", HttpStatus.BAD_REQUEST),
    INVALID_COUNTRY_CODE("CITY_004", "Invalid country code", HttpStatus.BAD_REQUEST),

    INVALID_TIMEZONE_OFFSET("CITY_005", "Invalid timezone offset format (expected ±HH:MM)", HttpStatus.BAD_REQUEST),

    // =========================
    // PAYMENT
    // =========================
    PAYMENT_FAILED("PAY_001", "Payment failed", HttpStatus.PAYMENT_REQUIRED);

    private final String code;
    private final String message;
    private final HttpStatus status;

    ErrorCode(String code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }
}