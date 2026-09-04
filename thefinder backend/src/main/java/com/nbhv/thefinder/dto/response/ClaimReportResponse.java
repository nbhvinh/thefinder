package com.nbhv.thefinder.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import com.nbhv.thefinder.entity.enums.ClaimStatus;
import com.nbhv.thefinder.entity.enums.PostStatus;
import com.nbhv.thefinder.entity.enums.PostType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClaimReportResponse {
    private Long id;
    private Long postId;
    private String postTitle;
    private PostType postType;
    private PostStatus postStatus;
    private Long claimantId;
    private String claimantName;
    // Giữ lại tạm thời để tương thích client cũ; frontend mới dùng claimantName.
    private String claimantUsername;
    private String description;
    private LocalDateTime meetTime;
    private String meetLocation;
    private ClaimStatus status;
    private LocalDateTime createdAt;
    private List<String> imageUrls;
}
