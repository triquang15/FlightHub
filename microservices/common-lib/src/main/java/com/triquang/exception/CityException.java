package com.triquang.exception;

import com.triquang.enums.ErrorCode;

public class CityException extends BaseException {
    private static final long serialVersionUID = 1L;

	public CityException(ErrorCode errorCode) {
        super(errorCode);
    }
}