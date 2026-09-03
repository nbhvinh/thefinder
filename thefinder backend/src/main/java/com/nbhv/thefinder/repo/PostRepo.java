package com.nbhv.thefinder.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.nbhv.thefinder.entity.Post;
import com.nbhv.thefinder.entity.enums.PostType;

public interface PostRepo extends JpaRepository<Post, Long>, JpaSpecificationExecutor<Post>  {
    List<Post> findByType(PostType type);
    List<Post> findByCategoryId(Long categoryId);
    List<Post> findByTitleContainingIgnoreCase(String keyword);
    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Post> findByHiddenFalse(Sort sort);
    Optional<Post> findByIdAndHiddenFalse(Long id);
}
