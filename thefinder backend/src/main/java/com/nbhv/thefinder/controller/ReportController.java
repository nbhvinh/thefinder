package com.nbhv.thefinder.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nbhv.thefinder.dto.request.ReportCreateRequest;
import com.nbhv.thefinder.entity.User;
import com.nbhv.thefinder.exception.UnauthorizedException;
import com.nbhv.thefinder.repo.UserRepo;
import com.nbhv.thefinder.service.ReportService;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/posts")
public class ReportController {

    private final ReportService reportService;
    private final UserRepo userRepo;

    public ReportController(ReportService reportService, UserRepo userRepo) {
        this.reportService = reportService;
        this.userRepo = userRepo;
    }

    @PostMapping("/{id}/reports")
    public ResponseEntity<Void> report(@PathVariable Long id,
                                       @Valid @RequestBody ReportCreateRequest req,
                                       HttpSession session) {
        User reporter = requireCurrentUser(session);
        reportService.createReport(id, req, reporter);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    private User requireCurrentUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("Cần đăng nhập");
        }
        return userRepo.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Phiên đăng nhập không hợp lệ"));
    }
}
