package com.stevechat.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "conversations")
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userAId;

    @Column(nullable = false)
    private Long userBId;

    private String status = "ACCEPTED"; // "PENDING", "ACCEPTED", "DECLINED"

    private Long initiatorId;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Conversation() {}

    public Conversation(Long userAId, Long userBId) {
        // Store the smaller id as userAId so a pair only ever has ONE conversation row,
        // regardless of who started it.
        if (userAId <= userBId) {
            this.userAId = userAId;
            this.userBId = userBId;
        } else {
            this.userAId = userBId;
            this.userBId = userAId;
        }
    }

    public Conversation(Long userAId, Long userBId, Long initiatorId, String status) {
        if (userAId <= userBId) {
            this.userAId = userAId;
            this.userBId = userBId;
        } else {
            this.userAId = userBId;
            this.userBId = userAId;
        }
        this.initiatorId = initiatorId;
        this.status = status != null ? status : "PENDING";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserAId() { return userAId; }
    public void setUserAId(Long userAId) { this.userAId = userAId; }

    public Long getUserBId() { return userBId; }
    public void setUserBId(Long userBId) { this.userBId = userBId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getInitiatorId() { return initiatorId; }
    public void setInitiatorId(Long initiatorId) { this.initiatorId = initiatorId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

