package com.nbhv.thefinder.service;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nbhv.thefinder.entity.User;
import com.nbhv.thefinder.dto.response.AdminUserResponse;
import com.nbhv.thefinder.entity.enums.UserRole;
import com.nbhv.thefinder.exception.ForbiddenException;
import com.nbhv.thefinder.exception.NotFoundException;
import com.nbhv.thefinder.repo.UserRepo;

@Service
public class UserService {

    private final UserRepo userRepo;

    public UserService(UserRepo userRepo) {
        this.userRepo = userRepo;
    }

    @Transactional
    public void blacklistUser(Long userId, User admin) {
        requireAdmin(admin);
        User target = userRepo.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (target.getId().equals(admin.getId()) || target.getRole() == UserRole.ADMIN) {
            throw new IllegalStateException("Không thể blacklist tài khoản admin");
        }
        if (target.isBlacklisted()) {
            throw new IllegalStateException("Tài khoản này đã nằm trong blacklist");
        }
        target.setBlacklisted(true);
        userRepo.save(target);
    }

    @Transactional
    public void removeFromBlacklist(Long userId, User admin) {
        requireAdmin(admin);
        User target = userRepo.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (!target.isBlacklisted()) {
            throw new IllegalStateException("Tài khoản này không nằm trong blacklist");
        }
        target.setBlacklisted(false);
        userRepo.save(target);
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> searchBlacklistCandidates(String query, User admin, int limit) {
        requireAdmin(admin);
        String normalizedQuery = query == null ? "" : query.trim();
        if (normalizedQuery.isEmpty()) {
            return List.of();
        }
        int safeLimit = Math.min(Math.max(limit, 1), 4);
        return userRepo.searchBlacklistCandidates(normalizedQuery, admin.getId(), PageRequest.of(0, safeLimit))
                .stream()
                .map(AdminUserResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getBlacklistedUsers(User admin) {
        requireAdmin(admin);
        return userRepo.findByBlacklistedTrueOrderByFullNameAsc(PageRequest.of(0, 100)).stream()
                .map(AdminUserResponse::from)
                .toList();
    }

    private void requireAdmin(User user) {
        if (user.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Admin only");
        }
    }
}
