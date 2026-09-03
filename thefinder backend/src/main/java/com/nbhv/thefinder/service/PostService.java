package com.nbhv.thefinder.service;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.nbhv.thefinder.dto.PostCreateRequest;
import com.nbhv.thefinder.dto.PostResponse;
import com.nbhv.thefinder.dto.PostUpdateRequest;
import com.nbhv.thefinder.entity.Category;
import com.nbhv.thefinder.entity.Post;
import com.nbhv.thefinder.entity.PostImage;
import com.nbhv.thefinder.entity.User;
import com.nbhv.thefinder.entity.enums.PostStatus;
import com.nbhv.thefinder.entity.enums.PostType;
import com.nbhv.thefinder.exception.ForbiddenException;
import com.nbhv.thefinder.exception.NotFoundException;
import com.nbhv.thefinder.exception.UnauthorizedException;
import com.nbhv.thefinder.repo.CategoryRepo;
import com.nbhv.thefinder.repo.PostRepo;
import com.nbhv.thefinder.repo.UserRepo;
import com.nbhv.thefinder.specification.PostSpecification;



@Service
public class PostService {
    private static final long EDIT_WINDOW_MINUTES = 60;
    private static final Sort OPEN_POSTS_FIRST = Sort.by(Sort.Order.asc("status"));

    private final PostRepo postrepo;
    private final UserRepo userrepo;
    private final CategoryRepo categoryrepo;
    private final ImageStorageService imageStorageService;

    private static final int MAX_IMAGES_PER_POST = 4;

    public PostService(PostRepo postrepo, UserRepo userrepo,
                        CategoryRepo categoryrepo, ImageStorageService imageStorageService) {
        this.postrepo = postrepo;
        this.userrepo = userrepo;
        this.categoryrepo = categoryrepo;
        this.imageStorageService = imageStorageService;
    }

    public Page<PostResponse> searchPosts(String keyword, PostType type, Long categoryId,
                                       String location, PostStatus status, Pageable pageable) {
        Specification<Post> spec = Specification
            .where(PostSpecification.isVisible())
            .and(PostSpecification.hasKeyword(keyword))
            .and(PostSpecification.hasType(type))
            .and(PostSpecification.hasCategory(categoryId))
            .and(PostSpecification.hasLocation(location))
            .and(PostSpecification.hasStatus(status));

        Pageable prioritizedPageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                OPEN_POSTS_FIRST.and(pageable.getSort()));

        return postrepo.findAll(spec, prioritizedPageable).map(PostResponse::from);
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
        return postrepo.findByHiddenFalse(OPEN_POSTS_FIRST.and(Sort.by(Sort.Order.desc("createdAt")))).stream()
                .map(PostResponse::from)
                .collect(Collectors.toList());
    }

    public List<PostResponse> getPostsByUser(Long userId) {
        return postrepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(PostResponse::from)
                .collect(Collectors.toList());
    }

    public PostResponse getPostById(Long id) {
        Post post = postrepo.findByIdAndHiddenFalse(id)
                .orElseThrow(() -> new NotFoundException("Post không tồn tại"));
        return PostResponse.from(post);
    }

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

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            PostImage image = new PostImage();
            image.setPost(post);
            image.setUrl(imageStorageService.store(file, "posts"));
            post.getImages().add(image);
        }

        postrepo.save(post);
        return PostResponse.from(post);
    }

    @Transactional
    public PostResponse updatePost(Long postId, PostUpdateRequest req, Long currentUserId) {
        requireAuthenticatedUser(currentUserId);
        Post post = postrepo.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        requireOwner(post, currentUserId);

        Duration elapsed = Duration.between(post.getCreatedAt(), OffsetDateTime.now());
        if (elapsed.toMinutes() >= EDIT_WINDOW_MINUTES) {
            throw new IllegalStateException("Edit window expired (1 hour)");
        }

        Category category = categoryrepo.findById(req.getCategoryId())
                .orElseThrow(() -> new NotFoundException("Category not found"));

        post.setTitle(req.getTitle());
        post.setDescription(req.getDescription());
        post.setLocation(req.getLocation());
        post.setCategory(category);
        post.setType(req.getType());

        return PostResponse.from(postrepo.save(post));
    }

    @Transactional
    public void deletePost(Long postId, Long currentUserId) {
        requireAuthenticatedUser(currentUserId);
        Post post = postrepo.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        requireOwner(post, currentUserId);
        imageStorageService.deleteAllForPost(post);
        postrepo.delete(post);
    }

    private void requireAuthenticatedUser(Long currentUserId) {
        if (currentUserId == null) {
            throw new UnauthorizedException("Cần đăng nhập");
        }
    }

    private void requireOwner(Post post, Long currentUserId) {
        if (!post.getUser().getId().equals(currentUserId)) {
            throw new ForbiddenException("Not the owner");
        }
    }
    
}
