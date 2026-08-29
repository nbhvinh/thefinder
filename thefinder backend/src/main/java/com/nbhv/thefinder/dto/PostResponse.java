package com.nbhv.thefinder.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.nbhv.thefinder.entity.Post;
import com.nbhv.thefinder.entity.enums.PostStatus;
import com.nbhv.thefinder.entity.enums.PostType;

import lombok.Getter;

@Getter
public class PostResponse {
    private Long id;
    private String title;
    private String description;
    private PostType type;
    private PostStatus status;
    private String location;
    private OffsetDateTime eventTime;
    private String authorName;
    private String categoryName;
    private OffsetDateTime createdAt;
    private List<PostImageResponse> images;

    public static PostResponse from(Post p) {
        PostResponse r = new PostResponse();
        r.id = p.getId();
        r.title = p.getTitle();
        r.description = p.getDescription();
        r.type = p.getType();
        r.status = p.getStatus();
        r.location = p.getLocation();
        r.eventTime = p.getEventTime();
        r.authorName = p.getUser().getFullName();
        r.categoryName = p.getCategory() != null ? p.getCategory().getName() : null;
        r.createdAt = p.getCreatedAt();
        r.images = p.getImages().stream()
                .map(PostImageResponse::from)
                .collect(Collectors.toList());
        return r;
    }
}