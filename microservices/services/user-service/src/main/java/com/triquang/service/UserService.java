package com.triquang.service;

import java.util.List;

import com.triquang.exception.UserException;
import com.triquang.model.User;

public interface UserService {
	User getUserByEmail(String email) throws UserException;

	User getUserById(Long id) throws UserException;

	List<User> getUsers() throws UserException;
}
