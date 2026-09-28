package com.stevechat.dto;

import java.time.LocalDateTime;

public class ConversationDto {
    private Long conversationId;
    private UserDto otherUser;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private String status;
    private Long initiatorId;

    public ConversationDto() {}

    public ConversationDto(Long conversationId, UserDto otherUser, String lastMessage, LocalDateTime lastMessageTime) {
        this(conversationId, otherUser, lastMessage, lastMessageTime, "ACCEPTED", null);
    }

    public ConversationDto(Long conversationId, UserDto otherUser, String lastMessage, LocalDateTime lastMessageTime, String status, Long initiatorId) {
        this.conversationId = conversationId;
        this.otherUser = otherUser;
        this.lastMessage = lastMessage;
        this.lastMessageTime = lastMessageTime;
        this.status = status != null ? status : "ACCEPTED";
        this.initiatorId = initiatorId;
    }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }

    public UserDto getOtherUser() { return otherUser; }
    public void setOtherUser(UserDto otherUser) { this.otherUser = otherUser; }

    public String getLastMessage() { return lastMessage; }
    public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }

    public LocalDateTime getLastMessageTime() { return lastMessageTime; }
    public void setLastMessageTime(LocalDateTime lastMessageTime) { this.lastMessageTime = lastMessageTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getInitiatorId() { return initiatorId; }
    public void setInitiatorId(Long initiatorId) { this.initiatorId = initiatorId; }
}

