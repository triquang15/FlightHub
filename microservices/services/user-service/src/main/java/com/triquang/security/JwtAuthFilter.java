package com.triquang.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.triquang.config.JwtProvider;
import com.triquang.model.User;
import com.triquang.repository.UserRepository;
import com.triquang.service.impl.CustomUserDetailsService;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {

            String token = header.substring(7);

            if (jwtProvider.validateToken(token) && jwtProvider.isAccessToken(token)) {

                String email = jwtProvider.getUsername(token);
                Long userId = jwtProvider.getUserId(token);
                Integer tokenVersion = jwtProvider.getTokenVersion(token);

                User user = userRepository.findById(userId).orElse(null);
                if (user == null || tokenVersion == null || !tokenVersion.equals(user.getTokenVersion())) {
                    filterChain.doFilter(request, response);
                    return;
                }

                var userDetails = userDetailsService.loadUserByUsername(email);

                var auth = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}
