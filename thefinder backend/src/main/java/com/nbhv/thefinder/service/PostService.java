package com.nbhv.thefinder.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.nbhv.thefinder.dto.PostCreateRequest;
import com.nbhv.thefinder.dto.PostResponse;
import com.nbhv.thefinder.entity.Category;
import com.nbhv.thefinder.entity.Post;
import com.nbhv.thefinder.entity.PostImage;
import com.nbhv.thefinder.entity.User;
import com.nbhv.thefinder.entity.enums.PostStatus;
import com.nbhv.thefinder.entity.enums.PostType;
import com.nbhv.thefinder.repo.CategoryRepo;
import com.nbhv.thefinder.repo.PostRepo;
import com.nbhv.thefinder.repo.UserRepo;
import com.nbhv.thefinder.specification.PostSpecification;



@Service
public class PostService {
    private final PostRepo postrepo;
    private final UserRepo userrepo;
    private final CategoryRepo categoryrepo;

    @Value("${app.upload.dir}")
    private String uploadDir;

    private static final int MAX_IMAGES_PER_POST = 4;

    public PostService(PostRepo postrepo, UserRepo userrepo,
                        CategoryRepo categoryrepo) {
        this.postrepo = postrepo;
        this.userrepo = userrepo;
        this.categoryrepo = categoryrepo;
    }

    public Page<PostResponse> searchPosts(String keyword, PostType type, Long categoryId,
                                       String location, PostStatus status, Pageable pageable) {
    Specification<Post> spec = Specification
            .where(PostSpecification.hasKeyword(keyword))
            .and(PostSpecification.hasType(type))
            .and(PostSpecification.hasCategory(categoryId))
            .and(PostSpecification.hasLocation(location))
            .and(PostSpecification.hasStatus(status));

    return postrepo.findAll(spec, pageable).map(PostResponse::from);
    }

    public PostResponse createPost(Long userId, PostCreateRequest req) {
        User user = userrepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        Post post = new Post();
        post.setUser(user);
        post.setType(req.getType());
        post.setTitle(req.getTitle());
        post.setDescription(req.getDescription());
        post.setLocation(req.getLocation());
        post.setEventTime(req.getEventTime());
        post.setContactInfo(req.getContactInfo());

        if (req.getCategoryId() != null) {
            Category category = categoryrepo.findById(req.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category không tồn tại"));
            post.setCategory(category);
        }

        return PostResponse.from(postrepo.save(post));
    }

    public List<PostResponse> getAllPosts() {
        return postrepo.findAll().stream()
                .map(PostResponse::from)
                .collect(Collectors.toList());
    }

    public PostResponse getPostById(Long id) {
        Post post = postrepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Post không tồn tại"));
        return PostResponse.from(post);
    }

    private static final List<String> ALLOWED_EXTENSIONS = List.of(".jpg", ".jpeg", ".png", ".webp");

    public PostResponse uploadImages(Long postId, Long userId, List<MultipartFile> files) {
        Post post = postrepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post không tồn tại"));

        if (!post.getUser().getId().equals(userId)) {
            throw new SecurityException("Bạn không có quyền thêm ảnh cho bài đăng này");
        }

        int currentCount = post.getImages().size();
        if (currentCount + files.size() > MAX_IMAGES_PER_POST) {
            throw new IllegalArgumentException(
                    "Chỉ được tối đa " + MAX_IMAGES_PER_POST + " ảnh mỗi bài đăng (hiện có "
                            + currentCount + ", đang tải thêm " + files.size() + ")");
        }

        try {
            Path uploadPath = Path.of(uploadDir);
            Files.createDirectories(uploadPath);

            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                String originalFilename = file.getOriginalFilename();
                if (originalFilename == null || !originalFilename.contains(".")) {
                    throw new IllegalArgumentException("File không có phần mở rộng hợp lệ");
                }

                String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("Định dạng file không hỗ trợ: " + ext);
        }

        String filename = UUID.randomUUID() + ext;
        Path target = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        PostImage image = new PostImage();
        image.setPost(post);
        image.setUrl("/images/posts/" + filename);
        post.getImages().add(image);
    }

            postrepo.save(post);
            return PostResponse.from(post);

        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi lưu file ảnh", e);
        }
    }
    
}

