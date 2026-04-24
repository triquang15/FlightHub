package com.triquang.exception;

import com.triquang.enums.ErrorCode;

public class UserException extends BaseException {
    private static final long serialVersionUID = 1L;

	public UserException(ErrorCode errorCode) {
        super(errorCode);
    }
}