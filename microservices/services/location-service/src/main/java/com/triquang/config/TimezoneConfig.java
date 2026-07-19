package com.triquang.config;

import lombok.extern.slf4j.Slf4j;
import net.iakovlev.timeshape.TimeZoneEngine;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

@Configuration
@Slf4j
public class TimezoneConfig {

    @Bean
    @Lazy
    public TimeZoneEngine timeZoneEngine() {
        log.info("🔥 Initializing TimeZoneEngine...");

        TimeZoneEngine engine = TimeZoneEngine.initialize();

        // 🔥 warmup luôn tại đây
        engine.query(10.8, 106.6);

        log.info("✅ TimeZoneEngine ready");

        return engine;
    }
}
