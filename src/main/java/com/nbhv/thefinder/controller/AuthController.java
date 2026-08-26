package com.nbhv.thefinder.controller;

import com.nbhv.thefinder.dto.LoginRequest;
import com.nbhv.thefinder.dto.RegisterRequest;
import com.nbhv.thefinder.entity.User;
import com.nbhv.thefinder.repo.UserRepo;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

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
        if (userRepo.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email đã được sử dụng");
        }
        User user = new User();
        user.setEmail(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setFullName(req.getFullName());
        user.setPhone(req.getPhone());
        userRepo.save(user);
        return ResponseEntity.ok().body("Đăng ký thành công");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req, HttpSession session) {
        User user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("Sai email hoặc mật khẩu"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Sai email hoặc mật khẩu");
        }
        session.setAttribute("userId", user.getId());
        return ResponseEntity.ok().body("Đăng nhập thành công");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok().body("Đã đăng xuất");
    }
}