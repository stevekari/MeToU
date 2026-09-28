package com.stevechat;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class StevechatApplication {
    public static void main(String[] args) {
        SpringApplication.run(StevechatApplication.class, args);
    }

    @Bean
    public CommandLineRunner updateSchema(JdbcTemplate jdbcTemplate) {
        return args -> {
            String[] migrations = {
                "ALTER TABLE users ALTER COLUMN avatar_url VARCHAR(2048)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS headline VARCHAR(255) DEFAULT ''",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(150) DEFAULT ''",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(150) DEFAULT ''",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS skills VARCHAR(500) DEFAULT ''",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url VARCHAR(2048)",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(500) DEFAULT ''",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_business BOOLEAN DEFAULT FALSE",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS business_services VARCHAR(500) DEFAULT ''",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_views BIGINT DEFAULT 0",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS post_impressions BIGINT DEFAULT 0",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS followers_count BIGINT DEFAULT 0",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count BIGINT DEFAULT 0"
            };

            for (String sql : migrations) {
                try {
                    jdbcTemplate.execute(sql);
                } catch (Exception ignored) {
                    // Column already exists or dialect variant
                }
            }
        };
    }
}
