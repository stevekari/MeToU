package com.stevechat.dto;

import com.stevechat.entity.Message;
import java.time.LocalDateTime;

public class MessageDto {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String content;
    private String status;
    private LocalDateTime readAt;
    private Long replyToId;
    private String replyToSenderName;
    private String replyToContent;
    private Boolean isEdited;
    private Boolean isDeleted;
    private LocalDateTime editedAt;
    private LocalDateTime timestamp;
    private String action = "MESSAGE_CREATE";

    public MessageDto() {}

    public MessageDto(Message message) {
        if (message != null) {
            this.id = message.getId();
            this.conversationId = message.getConversationId();
            this.senderId = message.getSenderId();
            this.content = message.getIsDeleted() ? "This message was deleted" : message.getContent();
            this.status = message.getStatus();
            this.readAt = message.getReadAt();
            this.replyToId = message.getReplyToId();
            this.replyToSenderName = message.getReplyToSenderName();
            this.replyToContent = message.getReplyToContent();
            this.isEdited = message.getIsEdited();
            this.isDeleted = message.getIsDeleted();
            this.editedAt = message.getEditedAt();
            this.timestamp = message.getTimestamp();
        }
    }

    public MessageDto(Message message, String action) {
        this(message);
        this.action = action;
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

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
}
