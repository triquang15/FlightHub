package com.triquang.config;

import java.io.IOException;
import java.util.UUID;

import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * Filter to generate and propagate a trace ID for each request. This allows for
 * better logging and tracing across microservices.
 * 
 * @author Tri Quang
 */

@Slf4j
@Component
public class TraceIdFilter implements Filter {

	public static final String TRACE_ID = "traceId";
	public static final String HEADER_TRACE_ID = "X-Trace-Id";

	@Override
	public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
			throws IOException, ServletException {

		HttpServletRequest req = (HttpServletRequest) request;
		HttpServletResponse res = (HttpServletResponse) response;

		String traceId = req.getHeader(HEADER_TRACE_ID);

		if (traceId == null || traceId.isBlank()) {
			traceId = UUID.randomUUID().toString();
		}

		MDC.put(TRACE_ID, traceId);
		res.setHeader(HEADER_TRACE_ID, traceId);

		log.info("Incoming request {} {} | traceId={}", req.getMethod(), req.getRequestURI(), traceId);

		try {
			chain.doFilter(request, response);
		} finally {
			log.info("Completed request {} {} | traceId={}", req.getMethod(), req.getRequestURI(), traceId);

			MDC.remove(TRACE_ID);
		}
	}
}