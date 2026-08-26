// service/PostService.java
package com.nbhv.thefinder.service;

import com.nbhv.thefinder.dto.PostCreateRequest;
import com.nbhv.thefinder.dto.PostResponse;
import com.nbhv.thefinder.entity.Category;
import com.nbhv.thefinder.entity.Post;
import com.nbhv.thefinder.entity.User;
import com.nbhv.thefinder.repo.CategoryRepo;
import com.nbhv.thefinder.repo.PostRepo;
import com.nbhv.thefinder.repo.UserRepo;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostService {

    private final PostRepo postrepo;
    private final UserRepo userrepo;
    private final CategoryRepo categoryrepo;

    public PostService(PostRepo postrepo, UserRepo userrepo,
                        CategoryRepo categoryrepo) {
        this.postrepo = postrepo;
        this.userrepo = userrepo;
        this.categoryrepo = categoryrepo;
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
}