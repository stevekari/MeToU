package com.stevechat.controller;

import com.stevechat.dto.UserDto;
import com.stevechat.entity.Connection;
import com.stevechat.entity.User;
import com.stevechat.repository.ConnectionRepository;
import com.stevechat.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/network", "/api/network"})
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class NetworkController {

    private final UserRepository userRepository;
    private final ConnectionRepository connectionRepository;

    public NetworkController(UserRepository userRepository, ConnectionRepository connectionRepository) {
        this.userRepository = userRepository;
        this.connectionRepository = connectionRepository;
    }

    private User currentUser(Authentication auth) {
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<?> getSuggestions(@RequestParam(required = false) String role,
                                            @RequestParam(required = false) String search,
                                            Authentication auth) {
        User me = currentUser(auth);
        List<User> allUsers = userRepository.findAll();
        Set<Long> connectedIds = connectionRepository.findByRequesterId(me.getId()).stream()
                .map(Connection::getReceiverId)
                .collect(Collectors.toSet());

        List<Map<String, Object>> suggestions = allUsers.stream()
                .filter(u -> !u.getId().equals(me.getId()))
                .filter(u -> {
                    if (role != null && !role.isBlank() && !"ALL".equalsIgnoreCase(role)) {
                        String userHeadline = (u.getHeadline() + " " + u.getBio() + " " + u.getSkills()).toLowerCase();
                        return userHeadline.contains(role.toLowerCase());
                    }
                    return true;
                })
                .filter(u -> {
                    if (search != null && !search.isBlank()) {
                        String query = search.toLowerCase();
                        return u.getUsername().toLowerCase().contains(query) ||
                               u.getDisplayName().toLowerCase().contains(query) ||
                               u.getHeadline().toLowerCase().contains(query) ||
                               u.getSkills().toLowerCase().contains(query);
                    }
                    return true;
                })
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("user", new UserDto(u));
                    map.put("isConnected", connectedIds.contains(u.getId()));
                    map.put("isBusiness", u.getIsBusiness());
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(suggestions);
    }

    @GetMapping("/connections")
    public ResponseEntity<?> getMyConnections(Authentication auth) {
        User me = currentUser(auth);
        List<Connection> connections = connectionRepository.findByRequesterId(me.getId());
        List<UserDto> users = connections.stream()
                .map(c -> userRepository.findById(c.getReceiverId()).orElse(null))
                .filter(Objects::nonNull)
                .map(UserDto::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping("/connect/{userId}")
    public ResponseEntity<?> toggleConnect(@PathVariable Long userId, Authentication auth) {
        User me = currentUser(auth);
        if (me.getId().equals(userId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot connect to yourself"));
        }

        User target = userRepository.findById(userId).orElse(null);
        if (target == null) {
            return ResponseEntity.notFound().build();
        }

        Optional<Connection> existing = connectionRepository.findByRequesterIdAndReceiverId(me.getId(), userId);
        boolean isConnectedNow;

        if (existing.isPresent()) {
            connectionRepository.delete(existing.get());
            target.setFollowersCount(Math.max(0, target.getFollowersCount() - 1));
            me.setFollowingCount(Math.max(0, me.getFollowingCount() - 1));
            isConnectedNow = false;
        } else {
            connectionRepository.save(new Connection(me.getId(), userId, "CONNECTED"));
            target.setFollowersCount(target.getFollowersCount() + 1);
            me.setFollowingCount(me.getFollowingCount() + 1);
            isConnectedNow = true;
        }

        userRepository.save(target);
        userRepository.save(me);

        return ResponseEntity.ok(Map.of(
                "targetUserId", userId,
                "isConnected", isConnectedNow,
                "targetFollowersCount", target.getFollowersCount()
        ));
    }

    @GetMapping("/businesses")
    public ResponseEntity<?> getBusinesses(Authentication auth) {
        List<User> businesses = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsBusiness()))
                .collect(Collectors.toList());
        List<UserDto> dtos = businesses.stream().map(UserDto::new).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
