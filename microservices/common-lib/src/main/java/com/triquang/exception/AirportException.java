package com.triquang.exception;

import com.triquang.enums.ErrorCode;

public class AirportException extends BaseException {
	private static final long serialVersionUID = 1L;

	public AirportException(ErrorCode errorCode) {
        super(errorCode);
    }
}