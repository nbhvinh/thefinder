package com.nbhv.thefinder.repo;

import com.nbhv.thefinder.entity.Post;
import com.nbhv.thefinder.entity.enums.PostType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PostRepo extends JpaRepository<Post, Long> {
    List<Post> findByType(PostType type);
    List<Post> findByCategoryId(Long categoryId);
    List<Post> findByTitleContainingIgnoreCase(String keyword);
}