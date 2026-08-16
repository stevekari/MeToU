package com.stevechat.dto;

public class AuthResponse {
    private String token;
    private Long userId;
    private String username;
    private String avatarUrl;

    public AuthResponse(String token, Long userId, String username, String avatarUrl) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.avatarUrl = avatarUrl;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
