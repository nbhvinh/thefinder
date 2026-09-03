package com.nbhv.thefinder.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nbhv.thefinder.dto.response.NotificationResponse;
import com.nbhv.thefinder.entity.Notification;
import com.nbhv.thefinder.entity.Post;
import com.nbhv.thefinder.entity.User;
import com.nbhv.thefinder.entity.enums.NotificationType;
import com.nbhv.thefinder.exception.ForbiddenException;
import com.nbhv.thefinder.exception.NotFoundException;
import com.nbhv.thefinder.repo.NotificationRepo;

@Service
public class NotificationService {

    private final NotificationRepo notificationRepo;

    public NotificationService(NotificationRepo notificationRepo) {
        this.notificationRepo = notificationRepo;
    }

    public void send(User user, NotificationType type, String message, Post post) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setMessage(message);
        notification.setPost(post);
        notificationRepo.save(notification);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getForUser(Long userId, Pageable pageable) {
        return notificationRepo.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationResponse::from);
    }

    @Transactional
    public void markRead(Long notificationId, Long userId) {
        Notification notification = notificationRepo.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("Notification not found"));
        if (!notification.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Not your notification");
        }
        notification.setRead(true);
        notificationRepo.save(notification);
    }
}
