package com.stevechat.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long conversationId;

    @Column(nullable = false)
    private Long senderId;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private String status = "SENT";

    private LocalDateTime readAt;

    private Long replyToId;

    private String replyToSenderName;

    @Column(length = 500)
    private String replyToContent;

    private Boolean isEdited = false;

    private Boolean isDeleted = false;

    private LocalDateTime editedAt;

    private LocalDateTime timestamp = LocalDateTime.now();

    public Message() {}

    public Message(Long conversationId, Long senderId, String content) {
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.content = content;
        this.status = "SENT";
        this.timestamp = LocalDateTime.now();
    }

    public Message(Long conversationId, Long senderId, String content, Long replyToId, String replyToSenderName, String replyToContent) {
        this.conversationId = conversationId;
        this.senderId = senderId;
        this.content = content;
        this.replyToId = replyToId;
        this.replyToSenderName = replyToSenderName;
        this.replyToContent = replyToContent;
        this.status = "SENT";
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }

    public Long getSenderId() { return senderId; }
    public void setSenderId(Long senderId) { this.senderId = senderId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }

    public Long getReplyToId() { return replyToId; }
    public void setReplyToId(Long replyToId) { this.replyToId = replyToId; }

    public String getReplyToSenderName() { return replyToSenderName; }
    public void setReplyToSenderName(String replyToSenderName) { this.replyToSenderName = replyToSenderName; }

    public String getReplyToContent() { return replyToContent; }
    public void setReplyToContent(String replyToContent) { this.replyToContent = replyToContent; }

    public Boolean getIsEdited() { return isEdited != null && isEdited; }
    public void setIsEdited(Boolean isEdited) { this.isEdited = isEdited; }

    public Boolean getIsDeleted() { return isDeleted != null && isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }

    public LocalDateTime getEditedAt() { return editedAt; }
    public void setEditedAt(LocalDateTime editedAt) { this.editedAt = editedAt; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
