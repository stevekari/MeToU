package com.stevechat.repository;

import com.stevechat.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdOrderByTimestampAsc(Long conversationId);
    Optional<Message> findTopByConversationIdOrderByTimestampDesc(Long conversationId);
}
