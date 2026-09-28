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
    private String headline;
    private String company;
    private String location;
    private String skills;
    private String bannerUrl;
    private String portfolioUrl;
    private Boolean isBusiness;
    private String businessServices;
    private Long profileViews;
    private Long postImpressions;
    private Long followersCount;
    private Long followingCount;
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
            this.headline = user.getHeadline();
            this.company = user.getCompany();
            this.location = user.getLocation();
            this.skills = user.getSkills();
            this.bannerUrl = user.getBannerUrl();
            this.portfolioUrl = user.getPortfolioUrl();
            this.isBusiness = user.getIsBusiness();
            this.businessServices = user.getBusinessServices();
            this.profileViews = user.getProfileViews();
            this.postImpressions = user.getPostImpressions();
            this.followersCount = user.getFollowersCount();
            this.followingCount = user.getFollowingCount();
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

    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }

    public String getBannerUrl() { return bannerUrl; }
    public void setBannerUrl(String bannerUrl) { this.bannerUrl = bannerUrl; }

    public String getPortfolioUrl() { return portfolioUrl; }
    public void setPortfolioUrl(String portfolioUrl) { this.portfolioUrl = portfolioUrl; }

    public Boolean getIsBusiness() { return isBusiness; }
    public void setIsBusiness(Boolean isBusiness) { this.isBusiness = isBusiness; }

    public String getBusinessServices() { return businessServices; }
    public void setBusinessServices(String businessServices) { this.businessServices = businessServices; }

    public Long getProfileViews() { return profileViews; }
    public void setProfileViews(Long profileViews) { this.profileViews = profileViews; }

    public Long getPostImpressions() { return postImpressions; }
    public void setPostImpressions(Long postImpressions) { this.postImpressions = postImpressions; }

    public Long getFollowersCount() { return followersCount; }
    public void setFollowersCount(Long followersCount) { this.followersCount = followersCount; }

    public Long getFollowingCount() { return followingCount; }
    public void setFollowingCount(Long followingCount) { this.followingCount = followingCount; }

    public String getCustomStatus() { return customStatus; }
    public void setCustomStatus(String customStatus) { this.customStatus = customStatus; }

    public LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
