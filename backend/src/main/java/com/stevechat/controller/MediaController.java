package com.stevechat.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/media")
public class MediaController {

    private final Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();

    public MediaController() throws IOException {
        Files.createDirectories(uploadDir);
    }

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file,
                                    @RequestParam("kind") String kind) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        String normalizedKind = kind == null ? "" : kind.trim().toLowerCase(Locale.ROOT);
        if (!normalizedKind.equals("image") && !normalizedKind.equals("audio")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid media kind"));
        }

        String rawContentType = file.getContentType();
        if (rawContentType == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unknown content type"));
        }
        String contentType = normalizeMimeType(rawContentType);

        if (normalizedKind.equals("image") && !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unsupported image format. Use PNG, JPEG, or JPG."));
        }
        if (normalizedKind.equals("image")
                && !contentType.equals("image/png")
                && !contentType.equals("image/jpeg")
                && !contentType.equals("image/jpg")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unsupported image format. Use PNG, JPEG, or JPG."));
        }
        if (normalizedKind.equals("audio") && !contentType.startsWith("audio/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unsupported audio format"));
        }

        String extension = getExtension(contentType, file.getOriginalFilename());
        String fileName = Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + extension;
        Path target = uploadDir.resolve(fileName);

        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return ResponseEntity.ok(Map.of(
                "url", "/media/files/" + fileName,
                "contentType", contentType,
                "fileName", file.getOriginalFilename() == null ? fileName : file.getOriginalFilename()
        ));
    }

    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String fileName) throws MalformedURLException {
        Path filePath = uploadDir.resolve(fileName).normalize();
        if (!filePath.startsWith(uploadDir) || !Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(filePath.toUri());
        String contentType = "application/octet-stream";
        try {
            String detected = Files.probeContentType(filePath);
            if (detected != null) contentType = detected;
        } catch (IOException ignored) {
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                .body(resource);
    }

    private String getExtension(String contentType, String originalFileName) {
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            case "audio/webm" -> ".webm";
            case "audio/ogg" -> ".ogg";
            case "audio/mpeg" -> ".mp3";
            case "audio/mp4" -> ".m4a";
            case "audio/wav" -> ".wav";
            default -> {
                String ext = StringUtils.getFilenameExtension(originalFileName);
                yield ext == null ? "" : "." + ext.toLowerCase(Locale.ROOT);
            }
        };
    }

    private String normalizeMimeType(String contentType) {
        return contentType.split(";")[0].trim().toLowerCase(Locale.ROOT);
    }
}
