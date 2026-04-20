package com.triquang.payload.response;

import java.time.Instant;

public record ApiResponse<T>(
	    int status,
	    boolean success,
	    String message,
	    T data,
	    Instant timestamp
	) {}
