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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
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
    private final SimpMessagingTemplate messagingTemplate;

    public PostController(PostRepository postRepository,
                          PostLikeRepository postLikeRepository,
                          PostCommentRepository postCommentRepository,
                          UserRepository userRepository,
                          SimpMessagingTemplate messagingTemplate) {
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.postCommentRepository = postCommentRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
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

        PostDto postDto = mapToDto(saved, me.getId());

        // Broadcast new post notification to all online friends & users
        Map<String, Object> event = new HashMap<>();
        event.put("type", "NEW_POST");
        event.put("action", "NEW_POST");
        event.put("post", postDto);
        event.put("author", new UserDto(me));
        event.put("title", (me.getDisplayName() != null && !me.getDisplayName().isBlank() ? me.getDisplayName() : me.getUsername()) + " created a new post");
        event.put("snippet", post.getContent().length() > 60 ? post.getContent().substring(0, 60) + "..." : post.getContent());
        messagingTemplate.convertAndSend("/topic/posts", event);

        return ResponseEntity.ok(postDto);
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

        Map<String, Object> resp = new HashMap<>();
        resp.put("postId", id);
        resp.put("likesCount", post.getLikesCount());
        resp.put("isLikedByMe", likedNow);
        resp.put("myReaction", likedNow ? reactionType : "");

        // Real-time broadcast
        Map<String, Object> event = new HashMap<>();
        event.put("type", "POST_LIKED");
        event.put("postId", id);
        event.put("likesCount", post.getLikesCount());
        event.put("isLiked", likedNow);
        event.put("reactionType", reactionType);
        event.put("actor", new UserDto(me));
        messagingTemplate.convertAndSend("/topic/posts", event);

        // If liked and not self-like, notify the post author directly
        if (likedNow && !post.getAuthorId().equals(me.getId())) {
            Map<String, Object> notif = new HashMap<>();
            notif.put("type", "POST_LIKED_NOTIFICATION");
            notif.put("postId", id);
            notif.put("actor", new UserDto(me));
            notif.put("title", (me.getDisplayName() != null ? me.getDisplayName() : me.getUsername()) + " liked your post");
            notif.put("snippet", post.getContent().length() > 50 ? post.getContent().substring(0, 50) + "..." : post.getContent());
            messagingTemplate.convertAndSend("/topic/user." + post.getAuthorId() + ".notifications", notif);
        }

        return ResponseEntity.ok(resp);
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

        PostCommentDto commentDto = new PostCommentDto(saved, new UserDto(me));

        // Real-time broadcast to posts topic
        Map<String, Object> event = new HashMap<>();
        event.put("type", "POST_COMMENTED");
        event.put("postId", id);
        event.put("comment", commentDto);
        event.put("commentsCount", post.getCommentsCount());
        messagingTemplate.convertAndSend("/topic/posts", event);

        // Notify post author if someone else commented
        if (!post.getAuthorId().equals(me.getId())) {
            Map<String, Object> notif = new HashMap<>();
            notif.put("type", "POST_COMMENT_NOTIFICATION");
            notif.put("postId", id);
            notif.put("actor", new UserDto(me));
            notif.put("title", (me.getDisplayName() != null ? me.getDisplayName() : me.getUsername()) + " commented on your post");
            notif.put("snippet", comment.getContent().length() > 50 ? comment.getContent().substring(0, 50) + "..." : comment.getContent());
            messagingTemplate.convertAndSend("/topic/user." + post.getAuthorId() + ".notifications", notif);
        }

        return ResponseEntity.ok(commentDto);
    }

    @Transactional
    @RequestMapping(value = "/{id}", method = {RequestMethod.DELETE, RequestMethod.POST})
    public ResponseEntity<?> deletePost(@PathVariable Long id, Authentication auth) {
        return performDeletePost(id, auth);
    }

    @Transactional
    @PostMapping("/{id}/delete")
    public ResponseEntity<?> deletePostAlias(@PathVariable Long id, Authentication auth) {
        return performDeletePost(id, auth);
    }

    private ResponseEntity<?> performDeletePost(Long id, Authentication auth) {
        User me = currentUser(auth);
        Post post = postRepository.findById(id).orElse(null);
        if (post == null) {
            return ResponseEntity.notFound().build();
        }
        if (!post.getAuthorId().equals(me.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Unauthorized to delete this post"));
        }

        postCommentRepository.deleteAll(postCommentRepository.findByPostIdOrderByCreatedAtAsc(id));
        postLikeRepository.deleteAll(postLikeRepository.findAll().stream().filter(l -> l.getPostId().equals(id)).collect(Collectors.toList()));
        postRepository.delete(post);

        Map<String, Object> event = new HashMap<>();
        event.put("type", "POST_DELETED");
        event.put("postId", id);
        messagingTemplate.convertAndSend("/topic/posts", event);

        return ResponseEntity.ok(Map.of("success", true, "deletedPostId", id));
    }
}
