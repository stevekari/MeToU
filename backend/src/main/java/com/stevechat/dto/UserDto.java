package com.stevechat.dto;

import com.stevechat.entity.User;
import java.time.LocalDateTime;

public class UserDto {
    private Long id;
    private String username;
    private String displayName;
    private String email;
    private String avatarUrl;
    private String bio;
    private String customStatus;
    private LocalDateTime lastSeen;
    private LocalDateTime createdAt;

    public UserDto() {}

    public UserDto(User user) {
        if (user != null) {
            this.id = user.getId();
            this.username = user.getUsername();
            this.displayName = user.getDisplayName();
            this.email = user.getEmail();
            this.avatarUrl = user.getAvatarUrl();
            this.bio = user.getBio();
            this.customStatus = user.getCustomStatus();
            this.lastSeen = user.getLastSeen();
            this.createdAt = user.getCreatedAt();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getCustomStatus() { return customStatus; }
    public void setCustomStatus(String customStatus) { this.customStatus = customStatus; }

    public LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
