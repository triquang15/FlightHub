package com.triquang.enums;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Centralized error codes for consistent error handling across the application.
 * Each error code includes a unique identifier, a message, and an associated
 * HTTP status.
 * 
 * @author Tri Quang
 */

@Getter
public enum ErrorCode {

	// =========================
	// SYSTEM
	// =========================
	INTERNAL_ERROR("SYS_001", "INTERNAL_ERROR", HttpStatus.INTERNAL_SERVER_ERROR),
	INVALID_INPUT("SYS_002", "INVALID_INPUT", HttpStatus.BAD_REQUEST),

	// =========================
	// USER
	// =========================
	USER_NOT_FOUND("USR_001", "USER_NOT_FOUND", HttpStatus.NOT_FOUND),
	EMAIL_ALREADY_EXISTS("USR_002", "EMAIL_ALREADY_EXISTS", HttpStatus.BAD_REQUEST),
	INVALID_CREDENTIALS("USR_003", "INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED),

	// =========================
	// AUTH
	// =========================
	INVALID_TOKEN("AUTH_001", "INVALID_TOKEN", HttpStatus.UNAUTHORIZED),
	INVALID_REFRESH_TOKEN("AUTH_002", "INVALID_REFRESH_TOKEN", HttpStatus.UNAUTHORIZED),
	ACCESS_DENIED("AUTH_003", "ACCESS_DENIED", HttpStatus.FORBIDDEN),

	// =========================
	// CITY
	// =========================
	CITY_NOT_FOUND("CITY_001", "CITY_NOT_FOUND", HttpStatus.NOT_FOUND),
	CITY_ALREADY_EXISTS("CITY_002", "CITY_ALREADY_EXISTS", HttpStatus.BAD_REQUEST),
	INVALID_CITY_CODE("CITY_003", "INVALID_CITY_CODE", HttpStatus.BAD_REQUEST),
	INVALID_COUNTRY_CODE("CITY_004", "INVALID_COUNTRY_CODE", HttpStatus.BAD_REQUEST),
	INVALID_TIMEZONE_OFFSET("CITY_005", "INVALID_TIMEZONE_OFFSET", HttpStatus.BAD_REQUEST),

	// =========================
	// AIRPORT
	// =========================
	AIRPORT_NOT_FOUND("APT_001", "AIRPORT_NOT_FOUND", HttpStatus.NOT_FOUND),
	AIRPORT_ALREADY_EXISTS("APT_002", "AIRPORT_ALREADY_EXISTS", HttpStatus.BAD_REQUEST),

	// =========================
	// AIRLINE
	// =========================
	AIRLINE_NOT_FOUND("ALN_001", "AIRLINE_NOT_FOUND", HttpStatus.NOT_FOUND),

	// =========================
	// AIRCRAFT
	// =========================
	AIRCRAFT_NOT_FOUND("AIR_001", "AIRCRAFT_NOT_FOUND", HttpStatus.NOT_FOUND),
	AIRCRAFT_ALREADY_EXISTS("AIR_002", "AIRCRAFT_ALREADY_EXISTS", HttpStatus.BAD_REQUEST),
	INVALID_AIRCRAFT_DATA("AIR_003", "INVALID_AIRCRAFT_DATA", HttpStatus.BAD_REQUEST),

	// =========================
	// FLIGHT
	// =========================
	FLIGHT_NOT_FOUND("FLT_001", "FLIGHT_NOT_FOUND", HttpStatus.NOT_FOUND),
	FLIGHT_ALREADY_EXISTS("FLT_002", "FLIGHT_ALREADY_EXISTS", HttpStatus.BAD_REQUEST),
	FLIGHT_INSTANCE_NOT_FOUND("FLT_003", "FLIGHT_INSTANCE_NOT_FOUND", HttpStatus.NOT_FOUND),

	// =========================
	// EXTERNAL SERVICE (Feign)
	// =========================
	EXTERNAL_SERVICE_ERROR("EXT_001", "EXTERNAL_SERVICE_ERROR", HttpStatus.BAD_GATEWAY),
	AIRLINE_SERVICE_UNAVAILABLE("EXT_002", "AIRLINE_SERVICE_UNAVAILABLE", HttpStatus.SERVICE_UNAVAILABLE),
	AIRCRAFT_SERVICE_UNAVAILABLE("EXT_003", "AIRCRAFT_SERVICE_UNAVAILABLE", HttpStatus.SERVICE_UNAVAILABLE),

	// =========================
	// FARE
	// =========================
	FARE_NOT_FOUND("FAR_001", "FARE_NOT_FOUND", HttpStatus.NOT_FOUND),
	FARE_ALREADY_EXISTS("FAR_002", "FARE_ALREADY_EXISTS", HttpStatus.BAD_REQUEST),
	
	
	// =========================
	// FARE RULES
	// =========================
	FARE_RULE_NOT_FOUND("FR_001", "FARE_RULE_NOT_FOUND", HttpStatus.NOT_FOUND),
	FARE_RULE_ALREADY_EXISTS("FR_002", "FARE_RULE_ALREADY_EXISTS", HttpStatus.BAD_REQUEST),
	
	// =========================
	// BAGGAGE POLICY
	// =========================
	BAGGAGE_POLICY_NOT_FOUND("BAG_001", "BAGGAGE_POLICY_NOT_FOUND", HttpStatus.NOT_FOUND),
	BAGGAGE_POLICY_ALREADY_EXISTS("BAG_002", "BAGGAGE_POLICY_ALREADY_EXISTS", HttpStatus.BAD_REQUEST),

	// =========================
	// SECURITY
	// =========================
	FORBIDDEN("SEC_001", "ACCESS_DENIED", HttpStatus.FORBIDDEN);

	private final String code;
	private final String message;
	private final HttpStatus status;

	ErrorCode(String code, String message, HttpStatus status) {
		this.code = code;
		this.message = message;
		this.status = status;
	}
}