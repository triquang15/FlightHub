package com.triquang.service;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class NotificationIdempotencyService {

    private static final String SENT_PREFIX = "notification:sent:";
    private static final String LOCK_PREFIX = "notification:processing:";

    private final StringRedisTemplate redisTemplate;
    private final Duration retention;
    private final Duration processingLockTtl;

    public NotificationIdempotencyService(
            StringRedisTemplate redisTemplate,
            @Value("${notification.idempotency.retention-seconds:86400}") long retentionSeconds,
            @Value("${notification.idempotency.processing-lock-seconds:300}") long processingLockSeconds
    ) {
        this.redisTemplate = redisTemplate;
        this.retention = Duration.ofSeconds(retentionSeconds);
        this.processingLockTtl = Duration.ofSeconds(processingLockSeconds);
    }

    public void runOnce(String key, ThrowingRunnable action) throws Exception {
        String sentKey = SENT_PREFIX + key;
        String lockKey = LOCK_PREFIX + key;

        if (Boolean.TRUE.equals(redisTemplate.hasKey(sentKey))) {
            log.info("Notification skipped duplicate key={}", key);
            return;
        }

        Boolean lockAcquired = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, "1", processingLockTtl);

        if (!Boolean.TRUE.equals(lockAcquired)) {
            log.info("Notification skipped in-flight duplicate key={}", key);
            return;
        }

        try {
            action.run();
            redisTemplate.opsForValue().set(sentKey, "1", retention);
        } catch (Exception ex) {
            throw ex;
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    @FunctionalInterface
    public interface ThrowingRunnable {
        void run() throws Exception;
    }
}
