package com.stevechat.controller;

import com.stevechat.dto.PostCommentDto;
import com.stevechat.dto.PostDto;
import com.stevechat.dto.UserDto;
import com.stevechat.entity.Post;
import com.stevechat.entity.PostComment;
import com.stevechat.entity.PostLike;
import com.stevechat.entity.User;
import com.stevechat.repository.PostCommentRepository;
import com.stevechat.repository.PostLikeRepository;
import com.stevechat.repository.PostRepository;
import com.stevechat.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/posts", "/api/posts"})
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class PostController {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostCommentRepository postCommentRepository;
    private final UserRepository userRepository;

    public PostController(PostRepository postRepository,
                          PostLikeRepository postLikeRepository,
                          PostCommentRepository postCommentRepository,
                          UserRepository userRepository) {
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.postCommentRepository = postCommentRepository;
        this.userRepository = userRepository;
    }

    private User currentUser(Authentication auth) {
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    private PostDto mapToDto(Post post, Long currentUserId) {
        User author = userRepository.findById(post.getAuthorId()).orElse(null);
        UserDto authorDto = author != null ? new UserDto(author) : null;
        Optional<PostLike> myLike = currentUserId != null 
                ? postLikeRepository.findByPostIdAndUserId(post.getId(), currentUserId) 
                : Optional.empty();
        
        PostDto dto = new PostDto(post, authorDto, myLike.isPresent(), myLike.map(PostLike::getReactionType).orElse(null));

        List<PostComment> comments = postCommentRepository.findByPostIdOrderByCreatedAtAsc(post.getId());
        List<PostCommentDto> commentDtos = comments.stream().map(c -> {
            User cAuthor = userRepository.findById(c.getAuthorId()).orElse(null);
            return new PostCommentDto(c, cAuthor != null ? new UserDto(cAuthor) : null);
        }).collect(Collectors.toList());
        dto.setComments(commentDtos);
        dto.setCommentsCount((long) comments.size());
        return dto;
    }

    @GetMapping
    public ResponseEntity<?> getFeed(@RequestParam(required = false) String type, Authentication auth) {
        Long currentUserId = auth != null ? currentUser(auth).getId() : null;
        List<Post> posts;
        if (type != null && !type.isBlank() && !"ALL".equalsIgnoreCase(type)) {
            posts = postRepository.findByPostTypeOrderByCreatedAtDesc(type.toUpperCase());
        } else {
            posts = postRepository.findAllByOrderByCreatedAtDesc();
        }

        List<PostDto> dtos = posts.stream()
                .map(p -> mapToDto(p, currentUserId))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserPosts(@PathVariable Long userId, Authentication auth) {
        Long currentUserId = auth != null ? currentUser(auth).getId() : null;
        List<Post> posts = postRepository.findByAuthorIdOrderByCreatedAtDesc(userId);
        List<PostDto> dtos = posts.stream()
                .map(p -> mapToDto(p, currentUserId))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody Map<String, Object> body, Authentication auth) {
        User me = currentUser(auth);
        String content = (String) body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Post content cannot be empty"));
        }

        Post post = new Post(me.getId(), content.trim());
        post.setMediaUrl((String) body.get("mediaUrl"));
        post.setMediaType((String) body.get("mediaType"));
        post.setPostType((String) body.getOrDefault("postType", "STANDARD"));
        post.setProjectUrl((String) body.get("projectUrl"));
        post.setJobTitle((String) body.get("jobTitle"));
        post.setJobCompany((String) body.get("jobCompany"));
        post.setJobLocation((String) body.get("jobLocation"));

        Post saved = postRepository.save(post);

        // Update author post impressions count
        me.setPostImpressions(me.getPostImpressions() + 10);
        userRepository.save(me);

        return ResponseEntity.ok(mapToDto(saved, me.getId()));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> toggleLike(@PathVariable Long id, 
                                        @RequestBody(required = false) Map<String, String> body,
                                        Authentication auth) {
        User me = currentUser(auth);
        Post post = postRepository.findById(id).orElse(null);
        if (post == null) {
            return ResponseEntity.notFound().build();
        }

        String reactionType = body != null && body.containsKey("reactionType") 
                ? body.get("reactionType") 
                : "LIKE";

        Optional<PostLike> existing = postLikeRepository.findByPostIdAndUserId(id, me.getId());
        boolean likedNow;
        if (existing.isPresent()) {
            if (existing.get().getReactionType().equalsIgnoreCase(reactionType)) {
                postLikeRepository.delete(existing.get());
                post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
                likedNow = false;
            } else {
                existing.get().setReactionType(reactionType);
                postLikeRepository.save(existing.get());
                likedNow = true;
            }
        } else {
            postLikeRepository.save(new PostLike(id, me.getId(), reactionType));
            post.setLikesCount(post.getLikesCount() + 1);
            likedNow = true;
        }

        postRepository.save(post);
        return ResponseEntity.ok(Map.of(
                "postId", id,
                "likesCount", post.getLikesCount(),
                "isLikedByMe", likedNow,
                "myReaction", likedNow ? reactionType : ""
        ));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<?> getComments(@PathVariable Long id) {
        List<PostComment> comments = postCommentRepository.findByPostIdOrderByCreatedAtAsc(id);
        List<PostCommentDto> dtos = comments.stream().map(c -> {
            User author = userRepository.findById(c.getAuthorId()).orElse(null);
            return new PostCommentDto(c, author != null ? new UserDto(author) : null);
        }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long id, 
                                         @RequestBody Map<String, String> body,
                                         Authentication auth) {
        User me = currentUser(auth);
        Post post = postRepository.findById(id).orElse(null);
        if (post == null) {
            return ResponseEntity.notFound().build();
        }

        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Comment cannot be empty"));
        }

        PostComment comment = new PostComment(id, me.getId(), content.trim());
        PostComment saved = postCommentRepository.save(comment);

        post.setCommentsCount(post.getCommentsCount() + 1);
        postRepository.save(post);

        return ResponseEntity.ok(new PostCommentDto(saved, new UserDto(me)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, Authentication auth) {
        User me = currentUser(auth);
        Post post = postRepository.findById(id).orElse(null);
        if (post == null) {
            return ResponseEntity.notFound().build();
        }
        if (!post.getAuthorId().equals(me.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Unauthorized to delete this post"));
        }

        postRepository.delete(post);
        return ResponseEntity.ok(Map.of("success", true, "deletedPostId", id));
    }
}
