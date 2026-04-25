package com.triquang.exception;

import com.triquang.enums.ErrorCode;

public class AircraftException extends BaseException {
    private static final long serialVersionUID = 1L;

	public AircraftException(ErrorCode errorCode) {
        super(errorCode);
    }
}
