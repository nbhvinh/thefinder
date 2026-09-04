package com.nbhv.thefinder.dto.response;

import com.nbhv.thefinder.entity.User;

import lombok.Getter;

@Getter
public class UserSearchResponse {
    private Long id;
    private String fullName;

    public static UserSearchResponse from(User user) {
        UserSearchResponse response = new UserSearchResponse();
        response.id = user.getId();
        response.fullName = user.getFullName();
        return response;
    }
}
