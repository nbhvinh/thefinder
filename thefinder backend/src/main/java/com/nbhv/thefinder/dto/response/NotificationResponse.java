package com.nbhv.thefinder.dto.response;

import java.time.OffsetDateTime;

import com.nbhv.thefinder.entity.Notification;
import com.nbhv.thefinder.entity.enums.NotificationType;

import lombok.Getter;

@Getter
public class NotificationResponse {
    private Long id;
    private NotificationType type;
    private String message;
    private Long postId;
    private boolean read;
    private OffsetDateTime createdAt;

    public static NotificationResponse from(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        response.id = notification.getId();
        response.type = notification.getType();
        response.message = notification.getMessage();
        response.postId = notification.getPost() == null ? null : notification.getPost().getId();
        response.read = notification.isRead();
        response.createdAt = notification.getCreatedAt();
        return response;
    }
}
