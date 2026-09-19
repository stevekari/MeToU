package com.stevechat.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/media")
@CrossOrigin(origins = {
        "https://your-frontend.onrender.com",
        "capacitor://localhost",
        "https://localhost",
        "http://localhost:5173"
})
public class MediaController {

    private final Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();

    public MediaController() throws IOException {
        Files.createDirectories(uploadDir);
    }

    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = ("KMGTPE").charAt(exp - 1) + "";
        return String.format(Locale.US, "%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file,
                                    @RequestParam(value = "kind", required = false, defaultValue = "file") String kind) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        String normalizedKind = kind == null ? "file" : kind.trim().toLowerCase(Locale.ROOT);
        String rawContentType = file.getContentType();
        String contentType = rawContentType != null ? normalizeMimeType(rawContentType) : "";

        // Fallback detection from filename if MIME type is missing or generic
        if (contentType.isBlank() || contentType.equals("application/octet-stream")) {
            String orig = file.getOriginalFilename();
            if (orig != null) {
                String ext = StringUtils.getFilenameExtension(orig);
                if (ext != null) {
                    switch (ext.toLowerCase(Locale.ROOT)) {
                        case "png" -> contentType = "image/png";
                        case "jpg", "jpeg" -> contentType = "image/jpeg";
                        case "webp" -> contentType = "image/webp";
                        case "gif" -> contentType = "image/gif";
                        case "svg" -> contentType = "image/svg+xml";
                        case "webm" -> contentType = "audio/webm";
                        case "ogg" -> contentType = "audio/ogg";
                        case "mp3" -> contentType = "audio/mpeg";
                        case "m4a", "mp4" -> contentType = "audio/mp4";
                        case "wav" -> contentType = "audio/wav";
                        case "pdf" -> contentType = "application/pdf";
                        case "doc" -> contentType = "application/msword";
                        case "docx" -> contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                        case "xls" -> contentType = "application/vnd.ms-excel";
                        case "xlsx" -> contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                        case "txt" -> contentType = "text/plain";
                        case "zip" -> contentType = "application/zip";
                    }
                }
            }
        }

        if (normalizedKind.equals("audio") && contentType.startsWith("video/webm")) {
            contentType = "audio/webm";
        }

        if (normalizedKind.equals("image") && !contentType.startsWith("image/")) {
            contentType = "image/jpeg";
        }

        if (normalizedKind.equals("audio") && !contentType.startsWith("audio/")) {
            contentType = "audio/webm";
        }

        try {
            Files.createDirectories(uploadDir);

            String extension = getExtension(contentType, file.getOriginalFilename());
            String fileName = Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + extension;
            Path target = uploadDir.resolve(fileName).normalize();

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            long bytes = file.getSize();
            Map<String, Object> result = new HashMap<>();
            result.put("url", "/media/files/" + fileName);
            result.put("contentType", contentType);
            result.put("fileName", file.getOriginalFilename() == null ? fileName : file.getOriginalFilename());
            result.put("sizeBytes", bytes);
            result.put("fileSize", formatFileSize(bytes));
            result.put("kind", normalizedKind);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to store media file: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String fileName) throws MalformedURLException {
        Path filePath = uploadDir.resolve(fileName).normalize();
        if (!filePath.startsWith(uploadDir) || !Files.exists(filePath)) {
            Path altPath = Paths.get("backend", "uploads").resolve(fileName).normalize().toAbsolutePath();
            if (Files.exists(altPath)) {
                filePath = altPath;
            } else {
                return ResponseEntity.notFound().build();
            }
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
            case "application/pdf" -> ".pdf";
            case "application/msword" -> ".doc";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> ".docx";
            case "application/vnd.ms-excel" -> ".xls";
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> ".xlsx";
            case "text/plain" -> ".txt";
            case "application/zip" -> ".zip";
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
