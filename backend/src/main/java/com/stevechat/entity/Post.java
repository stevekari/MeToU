package com.stevechat.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long authorId;

    @Column(length = 5000, nullable = false)
    private String content;

    @Column(length = 2048)
    private String mediaUrl;

    private String mediaType; // "image", "video", "document"

    private String postType = "STANDARD"; // "STANDARD", "PROJECT", "JOB", "OPPORTUNITY", "EVENT"

    @Column(length = 500)
    private String projectUrl;

    private String jobTitle;
    private String jobCompany;
    private String jobLocation;

    private Long likesCount = 0L;
    private Long commentsCount = 0L;
    private Long sharesCount = 0L;
    private Long viewsCount = 0L;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Post() {}

    public Post(Long authorId, String content) {
        this.authorId = authorId;
        this.content = content;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }

    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }

    public String getPostType() { return postType != null ? postType : "STANDARD"; }
    public void setPostType(String postType) { this.postType = postType; }

    public String getProjectUrl() { return projectUrl; }
    public void setProjectUrl(String projectUrl) { this.projectUrl = projectUrl; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getJobCompany() { return jobCompany; }
    public void setJobCompany(String jobCompany) { this.jobCompany = jobCompany; }

    public String getJobLocation() { return jobLocation; }
    public void setJobLocation(String jobLocation) { this.jobLocation = jobLocation; }

    public Long getLikesCount() { return likesCount != null ? likesCount : 0L; }
    public void setLikesCount(Long likesCount) { this.likesCount = likesCount; }

    public Long getCommentsCount() { return commentsCount != null ? commentsCount : 0L; }
    public void setCommentsCount(Long commentsCount) { this.commentsCount = commentsCount; }

    public Long getSharesCount() { return sharesCount != null ? sharesCount : 0L; }
    public void setSharesCount(Long sharesCount) { this.sharesCount = sharesCount; }

    public Long getViewsCount() { return viewsCount != null ? viewsCount : 0L; }
    public void setViewsCount(Long viewsCount) { this.viewsCount = viewsCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
