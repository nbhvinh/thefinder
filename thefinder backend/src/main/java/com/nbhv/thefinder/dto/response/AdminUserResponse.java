package com.nbhv.thefinder.dto.response;

import com.nbhv.thefinder.entity.User;
import com.nbhv.thefinder.entity.enums.UserRole;

import lombok.Getter;

@Getter
public class AdminUserResponse {
    private Long id;
    private String fullName;
    private String email;
    private UserRole role;
    private boolean blacklisted;

    public static AdminUserResponse from(User user) {
        AdminUserResponse response = new AdminUserResponse();
        response.id = user.getId();
        response.fullName = user.getFullName();
        response.email = user.getEmail();
        response.role = user.getRole();
        response.blacklisted = user.isBlacklisted();
        return response;
    }
}
