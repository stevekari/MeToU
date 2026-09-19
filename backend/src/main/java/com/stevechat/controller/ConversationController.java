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
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/conversations")
@CrossOrigin(origins = {
        "https://your-frontend.onrender.com",
        "capacitor://localhost",
        "https://localhost",
        "http://localhost:5173"
})
public class ConversationController {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;

    public ConversationController(ConversationRepository conversationRepository,
                                   MessageRepository messageRepository,
                                   UserRepository userRepository,
                                   ObjectMapper objectMapper,
                                   SimpMessagingTemplate messagingTemplate) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
        this.messagingTemplate = messagingTemplate;
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

                    String lastContent = null;
                    if (last != null) {
                        lastContent = last.getIsDeleted() ? "This message was deleted" : last.getContent();
                    }

                    return new ConversationDto(
                            conv.getId(),
                            otherDto,
                            lastContent,
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

    // Mark messages in a conversation as read
    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, Authentication auth) {
        User me = currentUser(auth);
        Conversation conv = conversationRepository.findById(id).orElse(null);
        if (conv == null) {
            return ResponseEntity.ok(Map.of("success", true));
        }
        if (!conv.getUserAId().equals(me.getId()) && !conv.getUserBId().equals(me.getId())) {
            return ResponseEntity.status(403).body("Not part of this conversation");
        }

        List<Message> messages = messageRepository.findByConversationIdOrderByTimestampAsc(id);
        LocalDateTime now = LocalDateTime.now();
        boolean updated = false;

        for (Message msg : messages) {
            if (!msg.getSenderId().equals(me.getId()) && !"READ".equals(msg.getStatus())) {
                msg.setStatus("READ");
                msg.setReadAt(now);
                messageRepository.save(msg);
                updated = true;
            }
        }

        if (updated) {
            Map<String, Object> receiptEvent = new HashMap<>();
            receiptEvent.put("conversationId", id);
            receiptEvent.put("readerId", me.getId());
            receiptEvent.put("readAt", now.toString());
            receiptEvent.put("status", "READ");

            messagingTemplate.convertAndSend("/topic/conversation." + id + ".receipts", receiptEvent);
        }

        return ResponseEntity.ok(Map.of("success", true, "readAt", now.toString()));
    }

    // Edit message REST endpoint
    @PutMapping("/messages/{messageId}")
    public ResponseEntity<?> editMessage(@PathVariable Long messageId, @RequestBody Map<String, String> body, Authentication auth) {
        User me = currentUser(auth);
        String newContent = body.get("content");
        if (newContent == null || newContent.trim().isBlank()) {
            return ResponseEntity.badRequest().body("Content cannot be empty");
        }

        Message message = messageRepository.findById(messageId).orElse(null);
        if (message == null) {
            return ResponseEntity.notFound().build();
        }
        if (!message.getSenderId().equals(me.getId())) {
            return ResponseEntity.status(403).body("Cannot edit other users' messages");
        }

        message.setContent(newContent.trim());
        message.setIsEdited(true);
        message.setEditedAt(LocalDateTime.now());
        Message saved = messageRepository.save(message);

        MessageDto dto = new MessageDto(saved, "MESSAGE_EDIT");
        messagingTemplate.convertAndSend("/topic/conversation." + saved.getConversationId(), dto);
        return ResponseEntity.ok(dto);
    }

    // Delete message REST endpoint (Soft delete)
    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long messageId, Authentication auth) {
        User me = currentUser(auth);
        Message message = messageRepository.findById(messageId).orElse(null);
        if (message == null) {
            return ResponseEntity.notFound().build();
        }
        if (!message.getSenderId().equals(me.getId())) {
            return ResponseEntity.status(403).body("Cannot delete other users' messages");
        }

        message.setIsDeleted(true);
        message.setContent("This message was deleted");
        Message saved = messageRepository.save(message);

        MessageDto dto = new MessageDto(saved, "MESSAGE_DELETE");
        messagingTemplate.convertAndSend("/topic/conversation." + saved.getConversationId(), dto);
        return ResponseEntity.ok(dto);
    }

    // List all call history events for current user
    @GetMapping("/calls")
    public List<Map<String, Object>> getCalls(Authentication auth) {
        User me = currentUser(auth);
        List<Conversation> convs = conversationRepository.findByUserAIdOrUserBId(me.getId(), me.getId());
        List<Map<String, Object>> callLogs = new ArrayList<>();

        for (Conversation conv : convs) {
            Long otherId = conv.getUserAId().equals(me.getId()) ? conv.getUserBId() : conv.getUserAId();
            User other = userRepository.findById(otherId).orElse(null);
            if (other == null) continue;
            UserDto otherDto = new UserDto(other);

            List<Message> messages = messageRepository.findByConversationIdOrderByTimestampAsc(conv.getId());
            for (Message msg : messages) {
                if (msg.getContent() != null && msg.getContent().contains("\"type\":\"call\"")) {
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> parsed = objectMapper.readValue(msg.getContent(), Map.class);
                        if ("call".equals(parsed.get("type"))) {
                            Map<String, Object> item = new HashMap<>();
                            item.put("id", msg.getId());
                            item.put("conversationId", conv.getId());
                            item.put("otherUser", otherDto);
                            item.put("senderId", msg.getSenderId());

                            Object callerIdObj = parsed.get("callerId");
                            Long callerId = callerIdObj != null ? Long.parseLong(callerIdObj.toString()) : msg.getSenderId();
                            item.put("callerId", callerId);

                            item.put("mediaType", parsed.getOrDefault("mediaType", "voice"));
                            item.put("status", parsed.getOrDefault("status", "missed"));
                            item.put("timestamp", msg.getTimestamp());

                            boolean isCaller = callerId.equals(me.getId());
                            String direction;
                            if (isCaller) {
                                direction = "outgoing";
                            } else if ("completed".equals(parsed.get("status"))) {
                                direction = "received";
                            } else {
                                direction = "missed";
                            }
                            item.put("direction", direction);
                            callLogs.add(item);
                        }
                    } catch (Exception ignored) {}
                }
            }
        }

        callLogs.sort((a, b) -> {
            Object tA = a.get("timestamp");
            Object tB = b.get("timestamp");
            if (tA instanceof java.time.LocalDateTime && tB instanceof java.time.LocalDateTime) {
                return ((java.time.LocalDateTime) tB).compareTo((java.time.LocalDateTime) tA);
            }
            return 0;
        });

        return callLogs;
    }
}
