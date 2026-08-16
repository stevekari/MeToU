package com.stevechat.controller;

import com.stevechat.dto.UpdateProfileRequest;
import com.stevechat.dto.UserDto;
import com.stevechat.entity.User;
import com.stevechat.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
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

        if (request.getAvatarUrl() != null) {
            me.setAvatarUrl(request.getAvatarUrl());
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
