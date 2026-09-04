package com.nbhv.thefinder.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nbhv.thefinder.dto.AccountUpdateRequest;
import com.nbhv.thefinder.dto.LoginRequest;
import com.nbhv.thefinder.dto.RegisterRequest;
import com.nbhv.thefinder.entity.User;
import com.nbhv.thefinder.exception.ForbiddenException;
import com.nbhv.thefinder.repo.UserRepo;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepo userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        if (userRepo.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body("Email đã được sử dụng");
        }
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setFullName(req.getFullName().trim());
        user.setPhone(req.getPhone() == null || req.getPhone().isBlank() ? null : req.getPhone().trim());
        userRepo.save(user);
        return ResponseEntity.ok().body("Đăng ký thành công");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req, HttpSession session) {
        User user = userRepo.findByEmail(req.getEmail().trim().toLowerCase()).orElse(null);
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(401).body("Sai email hoặc mật khẩu");
        }
        if (user.isBlacklisted()) {
            throw new ForbiddenException("Account is blacklisted");
        }
        session.setAttribute("userId", user.getId());
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "fullName", user.getFullName(),
                "email", user.getEmail(),
                "role", user.getRole()));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body("Chưa đăng nhập");
        }
        return userRepo.findById(userId)
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(userResponse(user)))
                .orElseGet(() -> ResponseEntity.status(401).body("Phiên đăng nhập không hợp lệ"));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateAccount(@Valid @RequestBody AccountUpdateRequest req, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body("Chưa đăng nhập");
        }

        User user = userRepo.findById(userId).orElse(null);
        if (user == null) {
            session.invalidate();
            return ResponseEntity.status(401).body("Phiên đăng nhập không hợp lệ");
        }

        String newPassword = req.getNewPassword();
        if (newPassword != null && !newPassword.isBlank()) {
            if (req.getCurrentPassword() == null
                    || !passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Mật khẩu hiện tại không đúng"));
            }
            if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Mật khẩu mới phải khác mật khẩu hiện tại"));
            }
            user.setPasswordHash(passwordEncoder.encode(newPassword));
        }

        user.setFullName(req.getFullName().trim());
        user.setPhone(req.getPhone() == null || req.getPhone().isBlank() ? null : req.getPhone().trim());
        user.setMessengerUrl(normalizeContactUrl(req.getMessengerUrl(), "Messenger"));
        user.setZaloUrl(normalizeContactUrl(req.getZaloUrl(), "Zalo"));
        user.setShowPhone(req.isShowPhone());
        user.setShowMessenger(req.isShowMessenger());
        user.setShowZalo(req.isShowZalo());
        return ResponseEntity.ok(userResponse(userRepo.save(user)));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok().body("Đã đăng xuất");
    }

    private Map<String, Object> userResponse(User user) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", user.getId());
        response.put("fullName", user.getFullName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("messengerUrl", user.getMessengerUrl());
        response.put("zaloUrl", user.getZaloUrl());
        response.put("showPhone", user.isShowPhone());
        response.put("showMessenger", user.isShowMessenger());
        response.put("showZalo", user.isShowZalo());
        response.put("role", user.getRole());
        response.put("createdAt", user.getCreatedAt());
        return response;
    }

    private String normalizeContactUrl(String value, String label) {
        if (value == null || value.isBlank()) return null;
        String url = value.trim();
        if (!url.startsWith("https://")) {
            throw new IllegalArgumentException("URL " + label + " phải bắt đầu bằng https://");
        }
        return url;
    }
}
