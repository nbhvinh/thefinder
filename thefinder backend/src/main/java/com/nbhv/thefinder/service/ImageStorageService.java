package com.nbhv.thefinder.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImageStorageService {

    private static final List<String> ALLOWED_EXTENSIONS = List.of(".jpg", ".jpeg", ".png", ".webp");
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;

    private final Path postUploadDir;

    public ImageStorageService(@Value("${app.upload.dir}") String postUploadDir) {
        this.postUploadDir = Path.of(postUploadDir);
    }

    public String store(MultipartFile file, String subDir) {
        validate(file);

        String originalFilename = file.getOriginalFilename();
        String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        String filename = UUID.randomUUID() + ext;
        Path uploadPath = resolveUploadPath(subDir);
        Path target = uploadPath.resolve(filename);

        try {
            Files.createDirectories(uploadPath);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi lưu file ảnh", e);
        }

        return "/images/" + subDir + "/" + filename;
    }

    public void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File ảnh không được để trống");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Mỗi ảnh không được vượt quá 5MB");
        }
        if (file.getContentType() == null || !ALLOWED_CONTENT_TYPES.contains(file.getContentType().toLowerCase())) {
            throw new IllegalArgumentException("Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new IllegalArgumentException("File không có phần mở rộng hợp lệ");
        }

        String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("Định dạng file không hỗ trợ: " + ext);
        }

    }

    private Path resolveUploadPath(String subDir) {
        if ("posts".equals(subDir)) {
            return postUploadDir;
        }

        Path parent = postUploadDir.getParent();
        return parent == null ? Path.of(subDir) : parent.resolve(subDir);
    }
}
