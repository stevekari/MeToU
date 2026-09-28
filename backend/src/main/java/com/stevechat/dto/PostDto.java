package com.stevechat.dto;

import com.stevechat.entity.Post;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PostDto {
    private Long id;
    private Long authorId;
    private UserDto author;
    private String content;
    private String mediaUrl;
    private String mediaType;
    private String postType;
    private String projectUrl;
    private String jobTitle;
    private String jobCompany;
    private String jobLocation;
    private Long likesCount;
    private Long commentsCount;
    private Long sharesCount;
    private Long viewsCount;
    private Boolean isLikedByMe = false;
    private String myReaction;
    private List<PostCommentDto> comments = new ArrayList<>();
    private LocalDateTime createdAt;

    public PostDto() {}

    public PostDto(Post post, UserDto author, boolean isLikedByMe, String myReaction) {
        if (post != null) {
            this.id = post.getId();
            this.authorId = post.getAuthorId();
            this.author = author;
            this.content = post.getContent();
            this.mediaUrl = post.getMediaUrl();
            this.mediaType = post.getMediaType();
            this.postType = post.getPostType();
            this.projectUrl = post.getProjectUrl();
            this.jobTitle = post.getJobTitle();
            this.jobCompany = post.getJobCompany();
            this.jobLocation = post.getJobLocation();
            this.likesCount = post.getLikesCount();
            this.commentsCount = post.getCommentsCount();
            this.sharesCount = post.getSharesCount();
            this.viewsCount = post.getViewsCount();
            this.isLikedByMe = isLikedByMe;
            this.myReaction = myReaction;
            this.createdAt = post.getCreatedAt();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }

    public UserDto getAuthor() { return author; }
    public void setAuthor(UserDto author) { this.author = author; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }

    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }

    public String getPostType() { return postType; }
    public void setPostType(String postType) { this.postType = postType; }

    public String getProjectUrl() { return projectUrl; }
    public void setProjectUrl(String projectUrl) { this.projectUrl = projectUrl; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getJobCompany() { return jobCompany; }
    public void setJobCompany(String jobCompany) { this.jobCompany = jobCompany; }

    public String getJobLocation() { return jobLocation; }
    public void setJobLocation(String jobLocation) { this.jobLocation = jobLocation; }

    public Long getLikesCount() { return likesCount; }
    public void setLikesCount(Long likesCount) { this.likesCount = likesCount; }

    public Long getCommentsCount() { return commentsCount; }
    public void setCommentsCount(Long commentsCount) { this.commentsCount = commentsCount; }

    public Long getSharesCount() { return sharesCount; }
    public void setSharesCount(Long sharesCount) { this.sharesCount = sharesCount; }

    public Long getViewsCount() { return viewsCount; }
    public void setViewsCount(Long viewsCount) { this.viewsCount = viewsCount; }

    public Boolean getIsLikedByMe() { return isLikedByMe; }
    public void setIsLikedByMe(Boolean isLikedByMe) { this.isLikedByMe = isLikedByMe; }

    public String getMyReaction() { return myReaction; }
    public void setMyReaction(String myReaction) { this.myReaction = myReaction; }

    public List<PostCommentDto> getComments() { return comments; }
    public void setComments(List<PostCommentDto> comments) { this.comments = comments; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
