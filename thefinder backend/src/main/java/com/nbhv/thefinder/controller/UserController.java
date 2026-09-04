package com.nbhv.thefinder.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

import com.nbhv.thefinder.dto.PostResponse;
import com.nbhv.thefinder.dto.response.UserProfileResponse;
import com.nbhv.thefinder.dto.response.UserSearchResponse;
import com.nbhv.thefinder.entity.ClaimReport;
import com.nbhv.thefinder.entity.User;
import com.nbhv.thefinder.entity.enums.ClaimStatus;
import com.nbhv.thefinder.exception.NotFoundException;
import com.nbhv.thefinder.exception.UnauthorizedException;
import com.nbhv.thefinder.repo.ClaimReportRepo;
import com.nbhv.thefinder.repo.PostRepo;
import com.nbhv.thefinder.repo.UserRepo;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepo userRepo;
    private final PostRepo postRepo;
    private final ClaimReportRepo claimRepo;

    @GetMapping("/search")
    public List<UserSearchResponse> search(@RequestParam(defaultValue = "") String query) {
        if (query.trim().length() < 2) return List.of();
        return userRepo.findTop8ByFullNameContainingIgnoreCaseAndBlacklistedFalseOrderByFullNameAsc(query.trim())
                .stream().map(UserSearchResponse::from).toList();
    }

    @GetMapping("/{id}")
    public UserProfileResponse profile(@PathVariable Long id) {
        User user = userRepo.findById(id)
                .filter(candidate -> !candidate.isBlacklisted())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
        UserProfileResponse response = UserProfileResponse.from(user);
        List<ClaimReport> claims = claimRepo.findByClaimantIdOrderByCreatedAtDesc(id);
        long confirmed = claims.stream().filter(claim -> claim.getStatus() == ClaimStatus.CONFIRMED).count();
        response.setPostCount(postRepo.findByUserIdAndHiddenFalseOrderByCreatedAtDesc(id).size());
        response.setHelpCount(claims.size());
        response.setReputation(claims.isEmpty() ? 0 : (int) Math.round(confirmed * 100.0 / claims.size()));
        return response;
    }

    @GetMapping("/{id}/posts")
    public List<PostResponse> posts(@PathVariable Long id) {
        if (!userRepo.existsById(id)) throw new NotFoundException("Không tìm thấy người dùng");
        return postRepo.findByUserIdAndHiddenFalseOrderByCreatedAtDesc(id).stream().map(PostResponse::from).toList();
    }

    @GetMapping("/contacts")
    @Transactional(readOnly = true)
    public ResponseEntity<?> contacts(HttpSession session) {
        Long currentUserId = (Long) session.getAttribute("userId");
        if (currentUserId == null) throw new UnauthorizedException("Bạn cần đăng nhập");

        Map<Long, User> contacts = new LinkedHashMap<>();
        List<ClaimStatus> contactStatuses = List.of(ClaimStatus.PENDING, ClaimStatus.REVIEWING);
        for (ClaimReport claim : claimRepo.findByPostUserIdOrderByCreatedAtDesc(currentUserId)) {
            if (contactStatuses.contains(claim.getStatus())) contacts.put(claim.getClaimant().getId(), claim.getClaimant());
        }
        for (ClaimReport claim : claimRepo.findByClaimantIdOrderByCreatedAtDesc(currentUserId)) {
            if (contactStatuses.contains(claim.getStatus())) contacts.put(claim.getPost().getUser().getId(), claim.getPost().getUser());
        }
        return ResponseEntity.ok(contacts.values().stream().filter(user -> !user.isBlacklisted()).map(UserProfileResponse::from).toList());
    }
}
