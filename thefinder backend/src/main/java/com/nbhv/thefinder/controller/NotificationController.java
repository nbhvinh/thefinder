package com.nbhv.thefinder.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nbhv.thefinder.dto.response.NotificationResponse;
import com.nbhv.thefinder.exception.UnauthorizedException;
import com.nbhv.thefinder.service.NotificationService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> list(Pageable pageable, HttpSession session) {
        return ResponseEntity.ok(notificationService.getForUser(requireUserId(session), pageable));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(@PathVariable Long id, HttpSession session) {
        notificationService.markRead(id, requireUserId(session));
        return ResponseEntity.noContent().build();
    }

    private Long requireUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("Cần đăng nhập");
        }
        return userId;
    }
}
