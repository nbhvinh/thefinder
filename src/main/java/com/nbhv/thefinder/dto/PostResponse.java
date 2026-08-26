package com.nbhv.thefinder.dto;

import com.nbhv.thefinder.entity.Post;
import com.nbhv.thefinder.entity.enums.PostStatus;
import com.nbhv.thefinder.entity.enums.PostType;
import java.time.OffsetDateTime;
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
        return r;
    }
    // getters
}