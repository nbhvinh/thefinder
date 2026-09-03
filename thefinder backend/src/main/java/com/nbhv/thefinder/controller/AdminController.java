package com.nbhv.thefinder.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.nbhv.thefinder.dto.response.AdminUserResponse;
import com.nbhv.thefinder.dto.response.ReportResponse;
import com.nbhv.thefinder.entity.User;
import com.nbhv.thefinder.exception.UnauthorizedException;
import com.nbhv.thefinder.repo.UserRepo;
import com.nbhv.thefinder.service.ReportService;
import com.nbhv.thefinder.service.UserService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ReportService reportService;
    private final UserService userService;
    private final UserRepo userRepo;

    public AdminController(ReportService reportService, UserService userService, UserRepo userRepo) {
        this.reportService = reportService;
        this.userService = userService;
        this.userRepo = userRepo;
    }

    @GetMapping("/reports")
    public ResponseEntity<Page<ReportResponse>> pendingReports(Pageable pageable, HttpSession session) {
        return ResponseEntity.ok(reportService.getPendingReports(requireCurrentUser(session), pageable));
    }

    @PostMapping("/reports/{id}/review")
    public ResponseEntity<Void> review(@PathVariable Long id, HttpSession session) {
        reportService.reviewReport(id, requireCurrentUser(session));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reports/{id}/dismiss")
    public ResponseEntity<Void> dismiss(@PathVariable Long id, HttpSession session) {
        reportService.dismissReport(id, requireCurrentUser(session));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/search")
    public ResponseEntity<List<AdminUserResponse>> searchUsers(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "4") int limit,
            HttpSession session) {
        return ResponseEntity.ok(userService.searchBlacklistCandidates(query, requireCurrentUser(session), limit));
    }

    @GetMapping("/users/blacklisted")
    public ResponseEntity<List<AdminUserResponse>> blacklistedUsers(HttpSession session) {
        return ResponseEntity.ok(userService.getBlacklistedUsers(requireCurrentUser(session)));
    }

    @PostMapping("/users/{id}/blacklist")
    public ResponseEntity<Void> blacklist(@PathVariable Long id, HttpSession session) {
        userService.blacklistUser(id, requireCurrentUser(session));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{id}/blacklist")
    public ResponseEntity<Void> removeFromBlacklist(@PathVariable Long id, HttpSession session) {
        userService.removeFromBlacklist(id, requireCurrentUser(session));
        return ResponseEntity.noContent().build();
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
