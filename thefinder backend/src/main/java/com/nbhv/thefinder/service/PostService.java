package com.nbhv.thefinder.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
            .where(PostSpecification.hasKeyword(keyword))
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
        return postrepo.findAll(OPEN_POSTS_FIRST.and(Sort.by(Sort.Order.desc("createdAt")))).stream()
                .map(PostResponse::from)
                .collect(Collectors.toList());
    }

    public List<PostResponse> getPostsByUser(Long userId) {
        return postrepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(PostResponse::from)
                .collect(Collectors.toList());
    }

    public PostResponse getPostById(Long id) {
        Post post = postrepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Post không tồn tại"));
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
    
}
