package com.nbhv.thefinder.dto;

import com.nbhv.thefinder.entity.PostImage;

import lombok.Getter;

@Getter
public class PostImageResponse {
    private Long id;
    private String url;

    public static PostImageResponse from(PostImage img) {
        PostImageResponse r = new PostImageResponse();
        r.id = img.getId();
        r.url = img.getUrl();
        return r;
    }
}