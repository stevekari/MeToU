package com.stevechat.repository;

import com.stevechat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByUserAIdAndUserBId(Long userAId, Long userBId);

    List<Conversation> findByUserAIdOrUserBId(Long userAId, Long userBId);
}
