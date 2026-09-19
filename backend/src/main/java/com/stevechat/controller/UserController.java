package com.stevechat.controller;

import com.stevechat.config.WebSocketEventListener;
import com.stevechat.dto.UpdateProfileRequest;
import com.stevechat.dto.UserDto;
import com.stevechat.entity.User;
import com.stevechat.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = {
        "https://your-frontend.onrender.com",
        "capacitor://localhost",
        "https://localhost",
        "http://localhost:5173"
})
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private User currentUser(Authentication auth) {
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @GetMapping("/all")
    public List<UserDto> getAllExceptSelf(Authentication auth) {
        User me = currentUser(auth);
        return userRepository.findByIdNot(me.getId())
                .stream()
                .map(UserDto::new)
                .toList();
    }

    @GetMapping("/search")
    public List<UserDto> searchByUsername(@RequestParam String query, Authentication auth) {
        User me = currentUser(auth);
        String trimmed = query == null ? "" : query.trim();
        if (trimmed.length() < 3) {
            return List.of();
        }
        return userRepository.findByIdNotAndUsernameContainingIgnoreCase(me.getId(), trimmed)
                .stream()
                .map(UserDto::new)
                .limit(20)
                .toList();
    }

    @GetMapping("/me")
    public UserDto getMe(Authentication auth) {
        return new UserDto(currentUser(auth));
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<UserDto> getUserProfile(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(UserDto::new)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/presence")
    public Map<Long, Map<String, Object>> getPresence() {
        Map<Long, String> statusMap = WebSocketEventListener.getUserStatuses();
        List<User> users = userRepository.findAll();
        Map<Long, Map<String, Object>> result = new HashMap<>();

        for (User u : users) {
            Map<String, Object> p = new HashMap<>();
            boolean isOnline = WebSocketEventListener.isUserOnline(u.getId());
            String status = statusMap.getOrDefault(u.getId(), u.getCustomStatus() != null ? u.getCustomStatus() : "offline");
            if (!isOnline && "online".equals(status)) {
                status = "offline";
            }
            p.put("status", status);
            p.put("online", isOnline);
            p.put("lastSeen", u.getLastSeen());
            p.put("displayName", u.getDisplayName());
            result.put(u.getId(), p);
        }

        return result;
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request, Authentication auth) {
        User me = currentUser(auth);

        if (request.getUsername() != null && !request.getUsername().isBlank()
                && !request.getUsername().equals(me.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                return ResponseEntity.badRequest().body("Username is already taken");
            }
            me.setUsername(request.getUsername());
        }

        if (request.getDisplayName() != null) {
            me.setDisplayName(request.getDisplayName());
        }

        if (request.getAvatarUrl() != null) {
            me.setAvatarUrl(request.getAvatarUrl());
        }

        if (request.getBio() != null) {
            me.setBio(request.getBio());
        }

        if (request.getCustomStatus() != null && !request.getCustomStatus().isBlank()) {
            me.setCustomStatus(request.getCustomStatus());
            WebSocketEventListener.setUserCustomStatus(me.getId(), request.getCustomStatus());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getCurrentPassword() == null
                    || !passwordEncoder.matches(request.getCurrentPassword(), me.getPassword())) {
                return ResponseEntity.status(401).body("Current password is incorrect");
            }
            me.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        userRepository.save(me);
        return ResponseEntity.ok(new UserDto(me));
    }
}
