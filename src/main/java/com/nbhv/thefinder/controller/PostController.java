package com.nbhv.thefinder.controller;

import com.nbhv.thefinder.dto.PostCreateRequest;
import com.nbhv.thefinder.dto.PostResponse;
import com.nbhv.thefinder.service.PostService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody PostCreateRequest req, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body("Cần đăng nhập");
        }
        return ResponseEntity.ok(postService.createPost(userId, req));
    }

    @GetMapping
    public ResponseEntity<List<PostResponse>> getAll() {
        return ResponseEntity.ok(postService.getAllPosts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getOne(@PathVariable Long id) {
        return ResponseEntity.ok(postService.getPostById(id));
    }
}