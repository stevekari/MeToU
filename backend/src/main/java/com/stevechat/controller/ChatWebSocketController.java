package com.stevechat.controller;

import com.stevechat.config.WebSocketEventListener;
import com.stevechat.dto.MessageDto;
import com.stevechat.dto.SendMessageRequest;
import com.stevechat.entity.Conversation;
import com.stevechat.entity.Message;
import com.stevechat.entity.User;
import com.stevechat.repository.ConversationRepository;
import com.stevechat.repository.MessageRepository;
import com.stevechat.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class ChatWebSocketController {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public ChatWebSocketController(MessageRepository messageRepository,
                                    ConversationRepository conversationRepository,
                                    UserRepository userRepository,
                                    SimpMessagingTemplate messagingTemplate,
                                    ObjectMapper objectMapper) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    private Long resolveSenderId(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return user.getId();
    }

    private MessageDto persistAndBroadcast(SendMessageRequest request, Long senderId) {
        Conversation conv = conversationRepository.findById(request.getConversationId().longValue())
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conv.getUserAId().equals(senderId) && !conv.getUserBId().equals(senderId)) {
            throw new RuntimeException("Not part of this conversation");
        }

        Message message = new Message(
                request.getConversationId(),
                senderId,
                request.getContent(),
                request.getReplyToId(),
                request.getReplyToSenderName(),
                request.getReplyToContent()
        );

        Message saved = messageRepository.save(message);

        MessageDto dto = new MessageDto(saved, "MESSAGE_CREATE");
        messagingTemplate.convertAndSend("/topic/conversation." + request.getConversationId(), dto);
        return dto;
    }

    // Real-time path: client sends STOMP frame to /app/chat.send
    @MessageMapping("/chat.send")
    public void sendViaWebSocket(SendMessageRequest request, Principal principal) {
        Long senderId = resolveSenderId(principal.getName());
        persistAndBroadcast(request, senderId);
    }

    // Real-time typing indicators
    @MessageMapping("/chat.typing")
    public void handleTyping(Map<String, Object> payload, Principal principal) {
        Object conversationId = payload.get("conversationId");
        if (conversationId == null) return;

        Long senderId = resolveSenderId(principal.getName());
        boolean isTyping = Boolean.parseBoolean(String.valueOf(payload.getOrDefault("isTyping", false)));

        Map<String, Object> typingEvent = new HashMap<>();
        typingEvent.put("conversationId", conversationId);
        typingEvent.put("userId", senderId);
        typingEvent.put("username", principal.getName());
        typingEvent.put("isTyping", isTyping);

        messagingTemplate.convertAndSend("/topic/conversation." + conversationId + ".typing", typingEvent);
    }

    // Real-time read receipts
    @MessageMapping("/chat.read")
    public void handleReadReceipt(Map<String, Object> payload, Principal principal) {
        Object convIdObj = payload.get("conversationId");
        if (convIdObj == null) return;

        Long readerId = resolveSenderId(principal.getName());
        Long convId = Long.parseLong(convIdObj.toString());

        List<Message> unreadMessages = messageRepository.findByConversationIdOrderByTimestampAsc(convId);
        LocalDateTime now = LocalDateTime.now();
        boolean updated = false;

        for (Message msg : unreadMessages) {
            if (!msg.getSenderId().equals(readerId) && !"READ".equals(msg.getStatus())) {
                msg.setStatus("READ");
                msg.setReadAt(now);
                messageRepository.save(msg);
                updated = true;
            }
        }

        if (updated) {
            Map<String, Object> receiptEvent = new HashMap<>();
            receiptEvent.put("conversationId", convId);
            receiptEvent.put("readerId", readerId);
            receiptEvent.put("readAt", now.toString());
            receiptEvent.put("status", "READ");

            messagingTemplate.convertAndSend("/topic/conversation." + convId + ".receipts", receiptEvent);
        }
    }

    // Real-time message edit
    @MessageMapping("/chat.edit")
    public void handleMessageEdit(Map<String, Object> payload, Principal principal) {
        Object msgIdObj = payload.get("messageId");
        Object contentObj = payload.get("content");
        if (msgIdObj == null || contentObj == null) return;

        Long senderId = resolveSenderId(principal.getName());
        Long messageId = Long.parseLong(msgIdObj.toString());
        String newContent = contentObj.toString().trim();

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!message.getSenderId().equals(senderId)) {
            throw new RuntimeException("Cannot edit messages sent by another user");
        }

        message.setContent(newContent);
        message.setIsEdited(true);
        message.setEditedAt(LocalDateTime.now());
        Message saved = messageRepository.save(message);

        MessageDto dto = new MessageDto(saved, "MESSAGE_EDIT");
        messagingTemplate.convertAndSend("/topic/conversation." + saved.getConversationId(), dto);
    }

    // Real-time message delete
    @MessageMapping("/chat.delete")
    public void handleMessageDelete(Map<String, Object> payload, Principal principal) {
        Object msgIdObj = payload.get("messageId");
        if (msgIdObj == null) return;

        Long senderId = resolveSenderId(principal.getName());
        Long messageId = Long.parseLong(msgIdObj.toString());

        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!message.getSenderId().equals(senderId)) {
            throw new RuntimeException("Cannot delete messages sent by another user");
        }

        message.setIsDeleted(true);
        message.setContent("This message was deleted");
        Message saved = messageRepository.save(message);

        MessageDto dto = new MessageDto(saved, "MESSAGE_DELETE");
        messagingTemplate.convertAndSend("/topic/conversation." + saved.getConversationId(), dto);
    }

    @MessageMapping("/call.signal")
    public void signalCall(Map<String, Object> signal, Principal principal) {
        Object conversationId = signal.get("conversationId");
        if (conversationId == null) {
            return;
        }

        Long senderId = resolveSenderId(principal.getName());
        long conversationIdValue = Long.parseLong(conversationId.toString());
        Conversation conversation = conversationRepository.findById(conversationIdValue)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        if (!conversation.getUserAId().equals(senderId) && !conversation.getUserBId().equals(senderId)) {
            throw new RuntimeException("Not part of this conversation");
        }

        signal.put("senderId", senderId);

        if ("call-end".equals(signal.get("callType"))) {
            persistCallLog(conversationIdValue, senderId, signal);
        }
        messagingTemplate.convertAndSend(
                "/topic/conversation." + conversationId,
                signal
        );
    }

    private void persistCallLog(long conversationId, Long senderId, Map<String, Object> signal) {
        try {
            Map<String, Object> callLog = new HashMap<>();
            callLog.put("type", "call");
            callLog.put("callId", signal.getOrDefault("callId", "unknown"));
            callLog.put("mediaType", signal.getOrDefault("mediaType", "voice"));
            callLog.put("status", signal.getOrDefault("status", "missed"));
            if (signal.containsKey("callerId") && signal.get("callerId") != null) {
                callLog.put("callerId", signal.get("callerId"));
            } else {
                callLog.put("callerId", senderId);
            }

            Message saved = messageRepository.save(
                    new Message(conversationId, senderId, objectMapper.writeValueAsString(callLog))
            );
            messagingTemplate.convertAndSend(
                    "/topic/conversation." + conversationId,
                    new MessageDto(saved)
            );
        } catch (Exception error) {
            throw new RuntimeException("Unable to save call history", error);
        }
    }

    @MessageMapping("/presence.status")
    public void updatePresenceStatus(Map<String, Object> payload, Principal principal) {
        Long senderId = resolveSenderId(principal.getName());
        String status = (String) payload.getOrDefault("status", "online");
        WebSocketEventListener.setUserCustomStatus(senderId, status);

        User user = userRepository.findById(senderId).orElse(null);
        if (user != null) {
            user.setCustomStatus(status);
            userRepository.save(user);
        }

        Map<String, Object> event = new HashMap<>();
        event.put("userId", senderId);
        event.put("username", principal.getName());
        event.put("status", status);
        event.put("lastSeen", null);
        event.put("online", !"offline".equalsIgnoreCase(status));

        messagingTemplate.convertAndSend("/topic/presence", event);
    }

    @MessageMapping("/presence.get")
    public void getPresenceList(Principal principal) {
        messagingTemplate.convertAndSend("/topic/presence.list", WebSocketEventListener.getUserStatuses());
    }

    // REST fallback
    @PostMapping("/messages/send")
    public ResponseEntity<?> sendViaRest(@RequestBody SendMessageRequest request, Authentication auth) {
        Long senderId = resolveSenderId(auth.getName());
        return ResponseEntity.ok(persistAndBroadcast(request, senderId));
    }
}
