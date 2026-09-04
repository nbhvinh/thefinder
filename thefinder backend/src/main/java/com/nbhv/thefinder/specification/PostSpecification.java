package com.nbhv.thefinder.specification;

import org.springframework.data.jpa.domain.Specification;

import com.nbhv.thefinder.entity.Post;
import com.nbhv.thefinder.entity.enums.PostStatus;
import com.nbhv.thefinder.entity.enums.PostType;

public class PostSpecification {

    public static Specification<Post> isVisible() {
        return (root, query, cb) -> cb.isFalse(root.get("hidden"));
    }

    public static Specification<Post> hasKeyword(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) return cb.conjunction();
            String like = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                cb.like(cb.lower(root.get("title")), like),
                cb.like(cb.lower(root.get("description")), like)
            );
        };
    }

    public static Specification<Post> hasType(PostType type) {
        return (root, query, cb) ->
            type == null ? cb.conjunction() : cb.equal(root.get("type"), type);
    }

    public static Specification<Post> hasCategory(Long categoryId, boolean includeUncategorized) {
        return (root, query, cb) -> {
            if (categoryId == null) return cb.conjunction();
            var selectedCategory = cb.equal(root.get("category").get("id"), categoryId);
            return includeUncategorized
                    ? cb.or(selectedCategory, cb.isNull(root.get("category")))
                    : selectedCategory;
        };
    }

    public static Specification<Post> hasLocation(String location) {
        return (root, query, cb) -> {
            if (location == null || location.isBlank()) return cb.conjunction();
            return cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase() + "%");
        };
    }

    public static Specification<Post> hasStatus(PostStatus status) {
        return (root, query, cb) ->
            status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }
}
