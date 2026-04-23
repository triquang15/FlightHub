package com.triquang.service.impl;

import java.time.LocalDateTime;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.triquang.config.JwtProvider;
import com.triquang.enums.UserRole;
import com.triquang.exception.UserException;
import com.triquang.mapper.UserMapper;
import com.triquang.model.User;
import com.triquang.payload.request.SignupRequest;
import com.triquang.payload.response.AuthResponse;
import com.triquang.repository.UserRepository;
import com.triquang.service.AuthService;

import lombok.RequiredArgsConstructor;

/**
 * Implementation of the AuthService interface for user authentication and registration.
 * 
 * @author Tri Quang
 */

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtProvider jwtProvider;
	private final CustomUserDetailsService customUserDetailsService;

	@Override
	public AuthResponse signup(SignupRequest req) throws UserException {

	    if (userRepository.findByEmail(req.getEmail()) != null) {
	        throw new UserException("Email already registered");
	    }

	    User user = new User();
	    user.setEmail(req.getEmail());
	    user.setPassword(passwordEncoder.encode(req.getPassword()));
	    user.setFullName(req.getFullName());
	    user.setPhone(req.getPhone());
	    user.setRole(UserRole.ROLE_CUSTOMER);
	    user.setLastLogin(LocalDateTime.now());

	    user = userRepository.save(user);

	    return buildAuthResponse(user);
	}
	
	@Override
	public AuthResponse login(String email, String password) throws UserException {

	    Authentication authentication = authenticate(email, password);
	    SecurityContextHolder.getContext().setAuthentication(authentication);

	    User user = userRepository.findByEmail(email);
	    if (user == null) throw new UserException("User not found");

	    user.setLastLogin(LocalDateTime.now());
	    userRepository.save(user);

	    return buildAuthResponse(user);
	}

	@Override
	public AuthResponse refreshToken(String refreshToken) throws UserException {

	    if (!jwtProvider.validateToken(refreshToken)) {
	        throw new UserException("Invalid token");
	    }

	    if (!jwtProvider.isRefreshToken(refreshToken)) {
	        throw new UserException("Not refresh token");
	    }

	    String email = jwtProvider.getUsername(refreshToken);

	    User user = userRepository.findByEmail(email);
	    if (user == null) throw new UserException("User not found");

	    return buildAuthResponse(user);
	}

	private AuthResponse buildAuthResponse(User user) {

	    UserDetails userDetails =
	            customUserDetailsService.loadUserByUsername(user.getEmail());

	    Authentication authentication =
	            new UsernamePasswordAuthenticationToken(
	                    userDetails,
	                    null,
	                    userDetails.getAuthorities()
	            );

	    String accessToken =
	            jwtProvider.generateAccessToken(authentication, user.getId());

	    String refreshToken =
	            jwtProvider.generateRefreshToken(authentication, user.getId());

	    return new AuthResponse(
	            accessToken,
	            refreshToken,
	            "Success",
	            "OK",
	            UserMapper.toDTO(user)
	    );
	}
	
	private Authentication authenticate(String email, String password) throws UserException {

	    UserDetails userDetails =
	            customUserDetailsService.loadUserByUsername(email);

	    if (!passwordEncoder.matches(password, userDetails.getPassword())) {
	        throw new UserException("Invalid credentials");
	    }

	    return new UsernamePasswordAuthenticationToken(
	            userDetails,
	            null,
	            userDetails.getAuthorities()
	    );
	}
}
