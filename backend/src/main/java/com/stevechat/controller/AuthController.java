package com.stevechat.controller;

import com.stevechat.dto.AuthRequest;
import com.stevechat.dto.AuthResponse;
import com.stevechat.dto.GoogleAuthRequest;
import com.stevechat.dto.RegisterRequest;
import com.stevechat.entity.User;
import com.stevechat.repository.UserRepository;
import com.stevechat.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping({"/auth", "/api/auth", "/api"})
@CrossOrigin(origins = {
        "https://your-frontend.onrender.com",
        "capacitor://localhost",
        "https://localhost",
        "http://localhost:5173"
})
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping({"/register", "/auth/register"})
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Email is already registered");
        }

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword())
        );
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getUsername(), user.getAvatarUrl()));
    }

    @PostMapping({"/login", "/auth/login"})
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid username or password");
        }

        String token = jwtUtil.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getUsername(), user.getAvatarUrl()));
    }

    @PostMapping({"/google", "/auth/google", "/login/google"})
    public ResponseEntity<?> googleAuth(@RequestBody GoogleAuthRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isBlank()) {
            return ResponseEntity.badRequest().body("Email is required for Google authentication");
        }

        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // Generate clean unique username based on display name or email prefix
            String baseUsername = (request.getDisplayName() != null && !request.getDisplayName().trim().isBlank())
                    ? request.getDisplayName().trim().replaceAll("[^a-zA-Z0-9_]", "").toLowerCase()
                    : email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "").toLowerCase();

            if (baseUsername.isBlank()) {
                baseUsername = "user";
            }

            String candidateUsername = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsername(candidateUsername)) {
                candidateUsername = baseUsername + counter;
                counter++;
            }

            user = new User(
                    candidateUsername,
                    email,
                    passwordEncoder.encode(UUID.randomUUID().toString())
            );

            String photoUrl = request.getPhotoUrl() != null ? request.getPhotoUrl().trim() : null;
            if (photoUrl != null && photoUrl.length() > 2000) {
                photoUrl = photoUrl.substring(0, 2000);
            }

            if (request.getDisplayName() != null && !request.getDisplayName().trim().isBlank()) {
                user.setDisplayName(request.getDisplayName().trim());
            }
            if (photoUrl != null && !photoUrl.isBlank()) {
                user.setAvatarUrl(photoUrl);
            }

            user = userRepository.save(user);
        } else {
            String photoUrl = request.getPhotoUrl() != null ? request.getPhotoUrl().trim() : null;
            if (photoUrl != null && photoUrl.length() > 2000) {
                photoUrl = photoUrl.substring(0, 2000);
            }

            boolean updated = false;
            if ((user.getAvatarUrl() == null || user.getAvatarUrl().isBlank()) && photoUrl != null && !photoUrl.isBlank()) {
                user.setAvatarUrl(photoUrl);
                updated = true;
            }
            if ((user.getDisplayName() == null || user.getDisplayName().isBlank()) && request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
                user.setDisplayName(request.getDisplayName().trim());
                updated = true;
            }
            if (updated) {
                user = userRepository.save(user);
            }
        }

        String token = jwtUtil.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(token, user.getId(), user.getUsername(), user.getAvatarUrl()));
    }
}
