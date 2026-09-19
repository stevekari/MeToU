package com.stevechat.config;

import com.stevechat.entity.User;
import com.stevechat.repository.UserRepository;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    // Track active user sessions: userId -> count of open sessions
    private static final ConcurrentHashMap<Long, Integer> activeUserSessionCounts = new ConcurrentHashMap<>();
    // Track user custom status: userId -> status string ("online", "busy", "offline")
    private static final ConcurrentHashMap<Long, String> userStatusMap = new ConcurrentHashMap<>();

    public WebSocketEventListener(SimpMessagingTemplate messagingTemplate, UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
    }

    public static Map<Long, String> getUserStatuses() {
        return Collections.unmodifiableMap(userStatusMap);
    }

    public static void setUserCustomStatus(Long userId, String status) {
        userStatusMap.put(userId, status);
    }

    public static boolean isUserOnline(Long userId) {
        return activeUserSessionCounts.getOrDefault(userId, 0) > 0;
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headers = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headers.getUser();

        if (principal != null && principal.getName() != null) {
            userRepository.findByUsername(principal.getName()).ifPresent(user -> {
                Long userId = user.getId();
                activeUserSessionCounts.merge(userId, 1, Integer::sum);
                String currentStatus = userStatusMap.getOrDefault(userId, user.getCustomStatus() != null ? user.getCustomStatus() : "online");
                userStatusMap.put(userId, currentStatus);

                Map<String, Object> presenceEvent = new HashMap<>();
                presenceEvent.put("userId", userId);
                presenceEvent.put("username", user.getUsername());
                presenceEvent.put("status", currentStatus);
                presenceEvent.put("lastSeen", null);
                presenceEvent.put("online", true);

                messagingTemplate.convertAndSend("/topic/presence", presenceEvent);
            });
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headers = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headers.getUser();

        if (principal != null && principal.getName() != null) {
            userRepository.findByUsername(principal.getName()).ifPresent(user -> {
                Long userId = user.getId();
                int remaining = activeUserSessionCounts.compute(userId, (k, count) -> (count == null || count <= 1) ? 0 : count - 1);

                if (remaining == 0) {
                    userStatusMap.put(userId, "offline");
                    LocalDateTime now = LocalDateTime.now();
                    user.setLastSeen(now);
                    userRepository.save(user);

                    Map<String, Object> presenceEvent = new HashMap<>();
                    presenceEvent.put("userId", userId);
                    presenceEvent.put("username", user.getUsername());
                    presenceEvent.put("status", "offline");
                    presenceEvent.put("lastSeen", now.toInstant(ZoneOffset.UTC).toEpochMilli());
                    presenceEvent.put("online", false);

                    messagingTemplate.convertAndSend("/topic/presence", presenceEvent);
                }
            });
        }
    }
}
