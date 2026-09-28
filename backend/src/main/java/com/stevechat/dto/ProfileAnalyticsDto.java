package com.stevechat.dto;

import java.util.List;
import java.util.Map;

public class ProfileAnalyticsDto {
    private Long profileViews;
    private Long postImpressions;
    private Long followersCount;
    private Long connectionsCount;
    private Long totalPostsCount;
    private Long totalReactionsCount;
    private List<Map<String, Object>> weeklyViews;
    private List<Map<String, Object>> weeklyImpressions;

    public ProfileAnalyticsDto() {}

    public Long getProfileViews() { return profileViews; }
    public void setProfileViews(Long profileViews) { this.profileViews = profileViews; }

    public Long getPostImpressions() { return postImpressions; }
    public void setPostImpressions(Long postImpressions) { this.postImpressions = postImpressions; }

    public Long getFollowersCount() { return followersCount; }
    public void setFollowersCount(Long followersCount) { this.followersCount = followersCount; }

    public Long getConnectionsCount() { return connectionsCount; }
    public void setConnectionsCount(Long connectionsCount) { this.connectionsCount = connectionsCount; }

    public Long getTotalPostsCount() { return totalPostsCount; }
    public void setTotalPostsCount(Long totalPostsCount) { this.totalPostsCount = totalPostsCount; }

    public Long getTotalReactionsCount() { return totalReactionsCount; }
    public void setTotalReactionsCount(Long totalReactionsCount) { this.totalReactionsCount = totalReactionsCount; }

    public List<Map<String, Object>> getWeeklyViews() { return weeklyViews; }
    public void setWeeklyViews(List<Map<String, Object>> weeklyViews) { this.weeklyViews = weeklyViews; }

    public List<Map<String, Object>> getWeeklyImpressions() { return weeklyImpressions; }
    public void setWeeklyImpressions(List<Map<String, Object>> weeklyImpressions) { this.weeklyImpressions = weeklyImpressions; }
}
