package com.triquang.exception;

public class OperationNotPermittedException extends Exception {
    private static final long serialVersionUID = 515730239401552483L;

	public OperationNotPermittedException(String message) {
        super(message);
    }
}
