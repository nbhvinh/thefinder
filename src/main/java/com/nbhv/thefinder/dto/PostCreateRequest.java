package com.nbhv.thefinder.dto;

import com.nbhv.thefinder.entity.enums.PostType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class PostCreateRequest {
    @NotNull
    private PostType type;
    @NotBlank
    private String title;
    private String description;
    private String location;
    private OffsetDateTime eventTime;
    private String contactInfo;
    private Long categoryId;
    // getters/setters
}