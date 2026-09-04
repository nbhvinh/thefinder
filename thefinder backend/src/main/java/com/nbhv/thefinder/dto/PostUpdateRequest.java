package com.nbhv.thefinder.dto;

import com.nbhv.thefinder.entity.enums.PostType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostUpdateRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    private String location;

    @NotNull
    private Long categoryId;

    @NotNull
    private PostType type;
}
