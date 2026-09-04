package com.nbhv.thefinder.dto.response;

import java.time.OffsetDateTime;

import com.nbhv.thefinder.entity.User;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserProfileResponse {
    private Long id;
    private String fullName;
    private OffsetDateTime createdAt;
    private String phone;
    private String messengerUrl;
    private String zaloUrl;
    private long postCount;
    private long helpCount;
    private int reputation;

    public static UserProfileResponse from(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.id = user.getId();
        response.fullName = user.getFullName();
        response.createdAt = user.getCreatedAt();
        response.phone = user.isShowPhone() ? user.getPhone() : null;
        response.messengerUrl = user.isShowMessenger() ? user.getMessengerUrl() : null;
        response.zaloUrl = user.isShowZalo() ? user.getZaloUrl() : null;
        return response;
    }
}
