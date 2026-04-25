package com.triquang.exception;

import com.triquang.enums.ErrorCode;

public class AirlineException extends BaseException {
    private static final long serialVersionUID = 2204774763407967628L;

	public AirlineException(ErrorCode errorCode) {
        super(errorCode);
    }
}