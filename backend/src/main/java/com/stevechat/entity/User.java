package com.stevechat.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    private String displayName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 2048)
    private String avatarUrl;

    @Column(length = 500)
    private String bio;

    @Column(length = 255)
    private String headline; // e.g. "Senior Software Engineer @ TechCorp | React & Java"

    @Column(length = 150)
    private String company;

    @Column(length = 150)
    private String location; // e.g. "Barcelona, Spain"

    @Column(length = 500)
    private String skills; // e.g. "React, Java, Spring Boot, WebRTC, UI/UX"

    @Column(length = 2048)
    private String bannerUrl;

    @Column(length = 500)
    private String portfolioUrl;

    private Boolean isBusiness = false;

    @Column(length = 500)
    private String businessServices;

    private Long profileViews = 0L;

    private Long postImpressions = 0L;

    private Long followersCount = 0L;

    private Long followingCount = 0L;

    private String customStatus = "online";

    private LocalDateTime lastSeen;

    private LocalDateTime createdAt = LocalDateTime.now();

    public User() {}

    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.displayName = username;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDisplayName() {
        return displayName != null && !displayName.isBlank() ? displayName : username;
    }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getHeadline() { return headline != null ? headline : ""; }
    public void setHeadline(String headline) { this.headline = headline; }

    public String getCompany() { return company != null ? company : ""; }
    public void setCompany(String company) { this.company = company; }

    public String getLocation() { return location != null ? location : ""; }
    public void setLocation(String location) { this.location = location; }

    public String getSkills() { return skills != null ? skills : ""; }
    public void setSkills(String skills) { this.skills = skills; }

    public String getBannerUrl() { return bannerUrl; }
    public void setBannerUrl(String bannerUrl) { this.bannerUrl = bannerUrl; }

    public String getPortfolioUrl() { return portfolioUrl; }
    public void setPortfolioUrl(String portfolioUrl) { this.portfolioUrl = portfolioUrl; }

    public Boolean getIsBusiness() { return isBusiness != null && isBusiness; }
    public void setIsBusiness(Boolean isBusiness) { this.isBusiness = isBusiness; }

    public String getBusinessServices() { return businessServices != null ? businessServices : ""; }
    public void setBusinessServices(String businessServices) { this.businessServices = businessServices; }

    public Long getProfileViews() { return profileViews != null ? profileViews : 0L; }
    public void setProfileViews(Long profileViews) { this.profileViews = profileViews; }

    public Long getPostImpressions() { return postImpressions != null ? postImpressions : 0L; }
    public void setPostImpressions(Long postImpressions) { this.postImpressions = postImpressions; }

    public Long getFollowersCount() { return followersCount != null ? followersCount : 0L; }
    public void setFollowersCount(Long followersCount) { this.followersCount = followersCount; }

    public Long getFollowingCount() { return followingCount != null ? followingCount : 0L; }
    public void setFollowingCount(Long followingCount) { this.followingCount = followingCount; }

    public String getCustomStatus() { return customStatus; }
    public void setCustomStatus(String customStatus) { this.customStatus = customStatus; }

    public LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(LocalDateTime lastSeen) { this.lastSeen = lastSeen; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
