package com.stevechat.controller;

import com.stevechat.dto.PostDto;
import com.stevechat.dto.UserDto;
import com.stevechat.entity.Connection;
import com.stevechat.entity.Post;
import com.stevechat.entity.User;
import com.stevechat.repository.ConnectionRepository;
import com.stevechat.repository.PostRepository;
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
    private final PostRepository postRepository;

    public NetworkController(UserRepository userRepository, 
                             ConnectionRepository connectionRepository,
                             PostRepository postRepository) {
        this.userRepository = userRepository;
        this.connectionRepository = connectionRepository;
        this.postRepository = postRepository;
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

        List<UserDto> suggestions = allUsers.stream()
                .filter(u -> !u.getId().equals(me.getId()))
                .filter(u -> {
                    if (role != null && !role.isBlank() && !"ALL".equalsIgnoreCase(role)) {
                        String userHeadline = ((u.getHeadline() != null ? u.getHeadline() : "") + " " +
                                               (u.getBio() != null ? u.getBio() : "") + " " +
                                               (u.getSkills() != null ? u.getSkills() : "")).toLowerCase();
                        return userHeadline.contains(role.toLowerCase());
                    }
                    return true;
                })
                .filter(u -> {
                    if (search != null && !search.isBlank()) {
                        String query = search.toLowerCase();
                        return (u.getUsername() != null && u.getUsername().toLowerCase().contains(query)) ||
                               (u.getDisplayName() != null && u.getDisplayName().toLowerCase().contains(query)) ||
                               (u.getHeadline() != null && u.getHeadline().toLowerCase().contains(query)) ||
                               (u.getSkills() != null && u.getSkills().toLowerCase().contains(query));
                    }
                    return true;
                })
                .map(UserDto::new)
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

    @GetMapping("/jobs")
    public ResponseEntity<?> getJobs(@RequestParam(required = false) String search,
                                     @RequestParam(required = false) String skill,
                                     Authentication auth) {
        List<Map<String, Object>> jobList = new ArrayList<>();

        // 1. Fetch user-posted jobs from PostRepository
        List<Post> jobPosts = postRepository.findByPostTypeOrderByCreatedAtDesc("JOB");
        for (Post post : jobPosts) {
            User author = userRepository.findById(post.getAuthorId()).orElse(null);
            Map<String, Object> job = new HashMap<>();
            job.put("id", post.getId());
            job.put("title", post.getJobTitle() != null && !post.getJobTitle().isBlank() ? post.getJobTitle() : "Software Opportunity");
            job.put("company", post.getJobCompany() != null && !post.getJobCompany().isBlank() ? post.getJobCompany() : (author != null ? author.getDisplayName() : "GioTech Network"));
            job.put("location", post.getJobLocation() != null && !post.getJobLocation().isBlank() ? post.getJobLocation() : "Remote / Hybrid");
            job.put("type", "Full-time");
            job.put("salary", "$80,000 - $120,000 / yr");
            job.put("description", post.getContent());
            job.put("skills", author != null && author.getSkills() != null ? author.getSkills() : "React, Java, Fullstack");
            job.put("author", author != null ? new UserDto(author) : null);
            job.put("createdAt", post.getCreatedAt());
            job.put("timeAgo", "Recently posted");
            job.put("isEasyApply", true);
            job.put("applicantsCount", 6);
            jobList.add(job);
        }

        // 2. Curated high-demand openings
        jobList.add(createCuratedJob(
                1001L,
                "Senior React & TypeScript Engineer",
                "GioTech Global",
                "Barcelona, Spain (Remote)",
                "Full-time",
                "$95,000 - $135,000 / yr",
                "Lead frontend architecture, build high-speed WebRTC video calling and interactive UI components.",
                "React, TypeScript, Redux Toolkit, WebSockets, TailwindCSS",
                "2h ago"
        ));

        jobList.add(createCuratedJob(
                1002L,
                "Java & Spring Boot Backend Developer",
                "CloudScale Microservices",
                "Madrid, Spain (Hybrid)",
                "Full-time",
                "$90,000 - $125,000 / yr",
                "Design scalable REST & WebSocket microservices, PostgreSQL indexing, and security architecture.",
                "Java, Spring Boot, PostgreSQL, Docker, Redis, Security",
                "5h ago"
        ));

        jobList.add(createCuratedJob(
                1003L,
                "Senior UI/UX Product Designer",
                "Studio Pixel Design",
                "Remote (Worldwide)",
                "Contract",
                "€60 - €90 / hr",
                "Create sleek dark/light design systems, mobile PWA interfaces, animations, and responsive wireframes.",
                "Figma, UI/UX, Design Systems, Mobile Apps, Prototyping",
                "1d ago"
        ));

        jobList.add(createCuratedJob(
                1004L,
                "Mobile Flutter & Android Developer",
                "Nexa Mobile Labs",
                "London, UK (Remote)",
                "Full-time",
                "£75,000 - £100,000 / yr",
                "Develop cross-platform iOS & Android communication applications with WebRTC and real-time push sync.",
                "Flutter, Dart, Android SDK, iOS, WebRTC, Firebase",
                "1d ago"
        ));

        jobList.add(createCuratedJob(
                1005L,
                "Full Stack Cloud Architect",
                "InnovateAI Systems",
                "Berlin, Germany (Remote)",
                "Full-time",
                "€100,000 - €140,000 / yr",
                "Orchestrate AWS/GCP cloud deployments, serverless functions, database scaling, and distributed messaging.",
                "React, Node.js, Java, AWS, Kubernetes, PostgreSQL",
                "2d ago"
        ));

        // Filter by search query if provided
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            jobList = jobList.stream().filter(j -> {
                String title = String.valueOf(j.get("title")).toLowerCase();
                String comp = String.valueOf(j.get("company")).toLowerCase();
                String loc = String.valueOf(j.get("location")).toLowerCase();
                String desc = String.valueOf(j.get("description")).toLowerCase();
                String sk = String.valueOf(j.get("skills")).toLowerCase();
                return title.contains(q) || comp.contains(q) || loc.contains(q) || desc.contains(q) || sk.contains(q);
            }).collect(Collectors.toList());
        }

        return ResponseEntity.ok(jobList);
    }

    private Map<String, Object> createCuratedJob(Long id, String title, String company, String location, 
                                                 String type, String salary, String desc, String skills, String timeAgo) {
        Map<String, Object> j = new HashMap<>();
        j.put("id", id);
        j.put("title", title);
        j.put("company", company);
        j.put("location", location);
        j.put("type", type);
        j.put("salary", salary);
        j.put("description", desc);
        j.put("skills", skills);
        j.put("timeAgo", timeAgo);
        j.put("isEasyApply", true);
        j.put("applicantsCount", 12 + (id.intValue() % 15));
        return j;
    }
}
