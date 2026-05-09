package com.triquang.fallback;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class BaseFallback {

    protected final Logger log = LoggerFactory.getLogger(getClass());

    protected void log(HttpServletRequest request, String service) {
        log.error("Fallback | service={} | path={} | traceId={}",
                service,
                request.getRequestURI(),
                request.getHeader("X-Trace-Id"));
    }
}