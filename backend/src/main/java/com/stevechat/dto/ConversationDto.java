package com.stevechat.dto;

import java.time.LocalDateTime;

public class ConversationDto {
    private Long conversationId;
    private UserDto otherUser;
    private String lastMessage;
    private LocalDateTime lastMessageTime;

    public ConversationDto(Long conversationId, UserDto otherUser, String lastMessage, LocalDateTime lastMessageTime) {
        this.conversationId = conversationId;
        this.otherUser = otherUser;
        this.lastMessage = lastMessage;
        this.lastMessageTime = lastMessageTime;
    }

    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long conversationId) { this.conversationId = conversationId; }

    public UserDto getOtherUser() { return otherUser; }
    public void setOtherUser(UserDto otherUser) { this.otherUser = otherUser; }

    public String getLastMessage() { return lastMessage; }
    public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }

    public LocalDateTime getLastMessageTime() { return lastMessageTime; }
    public void setLastMessageTime(LocalDateTime lastMessageTime) { this.lastMessageTime = lastMessageTime; }
}
