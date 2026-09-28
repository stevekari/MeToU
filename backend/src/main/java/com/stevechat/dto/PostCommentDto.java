package com.stevechat.dto;

import com.stevechat.entity.PostComment;
import java.time.LocalDateTime;

public class PostCommentDto {
    private Long id;
    private Long postId;
    private Long authorId;
    private UserDto author;
    private String content;
    private LocalDateTime createdAt;

    public PostCommentDto() {}

    public PostCommentDto(PostComment comment, UserDto author) {
        if (comment != null) {
            this.id = comment.getId();
            this.postId = comment.getPostId();
            this.authorId = comment.getAuthorId();
            this.author = author;
            this.content = comment.getContent();
            this.createdAt = comment.getCreatedAt();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }

    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }

    public UserDto getAuthor() { return author; }
    public void setAuthor(UserDto author) { this.author = author; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
