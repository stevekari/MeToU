package com.stevechat.repository;

import com.stevechat.entity.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {
    Optional<Connection> findByRequesterIdAndReceiverId(Long requesterId, Long receiverId);
    List<Connection> findByRequesterId(Long requesterId);
    List<Connection> findByReceiverId(Long receiverId);
    boolean existsByRequesterIdAndReceiverId(Long requesterId, Long receiverId);
    long countByReceiverId(Long receiverId);
    long countByRequesterId(Long requesterId);
    void deleteByRequesterIdAndReceiverId(Long requesterId, Long receiverId);
}
