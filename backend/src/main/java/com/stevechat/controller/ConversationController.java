package com.stevechat.controller;

import com.stevechat.dto.ConversationDto;
import com.stevechat.dto.MessageDto;
import com.stevechat.dto.UserDto;
import com.stevechat.entity.Conversation;
import com.stevechat.entity.Message;
import com.stevechat.entity.User;
import com.stevechat.repository.ConversationRepository;
import com.stevechat.repository.MessageRepository;
import com.stevechat.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/conversations")
public class ConversationController {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public ConversationController(ConversationRepository conversationRepository,
                                   MessageRepository messageRepository,
                                   UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    private User currentUser(Authentication auth) {
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    // Start (or fetch existing) conversation with a friend
    @PostMapping("/start")
    public ResponseEntity<?> start(@RequestBody Map<String, Long> body, Authentication auth) {
        User me = currentUser(auth);
        Long friendId = body.get("friendId");

        if (friendId == null || friendId.equals(me.getId())) {
            return ResponseEntity.badRequest().body("Invalid friendId");
        }
        if (!userRepository.existsById(friendId)) {
            return ResponseEntity.badRequest().body("User not found");
        }

        Long a = Math.min(me.getId(), friendId);
        Long b = Math.max(me.getId(), friendId);

        Conversation conversation = conversationRepository.findByUserAIdAndUserBId(a, b)
                .orElseGet(() -> conversationRepository.save(new Conversation(a, b)));

        return ResponseEntity.ok(Map.of("conversationId", conversation.getId()));
    }

    // List all of my conversations with a preview of the last message
    @GetMapping("/mine")
    public List<ConversationDto> mine(Authentication auth) {
        User me = currentUser(auth);

        return conversationRepository.findByUserAIdOrUserBId(me.getId(), me.getId())
                .stream()
                .map(conv -> {
                    Long otherId = conv.getUserAId().equals(me.getId()) ? conv.getUserBId() : conv.getUserAId();
                    User other = userRepository.findById(otherId).orElse(null);
                    UserDto otherDto = other != null ? new UserDto(other) : null;

                    Message last = messageRepository
                            .findTopByConversationIdOrderByTimestampDesc(conv.getId())
                            .orElse(null);

                    return new ConversationDto(
                            conv.getId(),
                            otherDto,
                            last != null ? last.getContent() : null,
                            last != null ? last.getTimestamp() : conv.getCreatedAt()
                    );
                })
                .toList();
    }

    // Load all messages in a conversation
    @GetMapping("/{id}/messages")
    public ResponseEntity<?> getMessages(@PathVariable Long id, Authentication auth) {
        User me = currentUser(auth);
        Conversation conv = conversationRepository.findById(id).orElse(null);

        if (conv == null) {
            return ResponseEntity.notFound().build();
        }
        if (!conv.getUserAId().equals(me.getId()) && !conv.getUserBId().equals(me.getId())) {
            return ResponseEntity.status(403).body("Not part of this conversation");
        }

        List<MessageDto> messages = messageRepository.findByConversationIdOrderByTimestampAsc(id)
                .stream()
                .map(MessageDto::new)
                .toList();

        return ResponseEntity.ok(messages);
    }
}
