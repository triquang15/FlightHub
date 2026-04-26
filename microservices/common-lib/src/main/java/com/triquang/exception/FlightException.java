package com.triquang.exception;

import com.triquang.enums.ErrorCode;

public class FlightException extends BaseException {
    private static final long serialVersionUID = 2204774763407967628L;

	public FlightException(ErrorCode errorCode) {
        super(errorCode);
    }
}
