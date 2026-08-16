package com.stevechat.controller;

import com.stevechat.dto.MessageDto;
import com.stevechat.dto.SendMessageRequest;
import com.stevechat.entity.Conversation;
import com.stevechat.entity.Message;
import com.stevechat.entity.User;
import com.stevechat.repository.ConversationRepository;
import com.stevechat.repository.MessageRepository;
import com.stevechat.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
public class ChatWebSocketController {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWebSocketController(MessageRepository messageRepository,
                                    ConversationRepository conversationRepository,
                                    UserRepository userRepository,
                                    SimpMessagingTemplate messagingTemplate) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    private Long resolveSenderId(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return user.getId();
    }

    private MessageDto persistAndBroadcast(SendMessageRequest request, Long senderId) {
        Conversation conv = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!conv.getUserAId().equals(senderId) && !conv.getUserBId().equals(senderId)) {
            throw new RuntimeException("Not part of this conversation");
        }

        Message saved = messageRepository.save(
                new Message(request.getConversationId(), senderId, request.getContent())
        );

        MessageDto dto = new MessageDto(saved);
        messagingTemplate.convertAndSend("/topic/conversation." + request.getConversationId(), dto);
        return dto;
    }

    // Real-time path: client sends STOMP frame to /app/chat.send
    @MessageMapping("/chat.send")
    public void sendViaWebSocket(SendMessageRequest request, Principal principal) {
        Long senderId = resolveSenderId(principal.getName());
        persistAndBroadcast(request, senderId);
    }

    // REST fallback: same effect, useful for simple testing without a socket
    @PostMapping("/messages/send")
    public ResponseEntity<?> sendViaRest(@RequestBody SendMessageRequest request, Authentication auth) {
        Long senderId = resolveSenderId(auth.getName());
        return ResponseEntity.ok(persistAndBroadcast(request, senderId));
    }
}
