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
            try {
                jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN avatar_url VARCHAR(2048)");
            } catch (Exception ignored) {
                // Table or column might already be updated or dialect difference
            }
        };
    }
}

