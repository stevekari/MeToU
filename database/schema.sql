-- Steve Chat schema
-- Works on MySQL 8+ and PostgreSQL 13+ with the noted tweaks.

CREATE TABLE users (
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,   -- Postgres: GENERATED ALWAYS AS IDENTITY
    username     VARCHAR(50)  NOT NULL UNIQUE,
    email        VARCHAR(255) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    avatar_url   VARCHAR(500),
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- One row per unique pair of users (user_a_id is always the smaller id).
CREATE TABLE conversations (
    id           BIGINT PRIMARY KEY AUTO_INCREMENT,   -- Postgres: GENERATED ALWAYS AS IDENTITY
    user_a_id    BIGINT NOT NULL REFERENCES users(id),
    user_b_id    BIGINT NOT NULL REFERENCES users(id),
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_a_id, user_b_id)
);

CREATE TABLE messages (
    id               BIGINT PRIMARY KEY AUTO_INCREMENT,  -- Postgres: GENERATED ALWAYS AS IDENTITY
    conversation_id  BIGINT NOT NULL REFERENCES conversations(id),
    sender_id        BIGINT NOT NULL REFERENCES users(id),
    content          TEXT NOT NULL,
    timestamp        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, timestamp);
CREATE INDEX idx_conversations_user_a ON conversations(user_a_id);
CREATE INDEX idx_conversations_user_b ON conversations(user_b_id);

-- Postgres note: replace "BIGINT PRIMARY KEY AUTO_INCREMENT" with:
--   id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
