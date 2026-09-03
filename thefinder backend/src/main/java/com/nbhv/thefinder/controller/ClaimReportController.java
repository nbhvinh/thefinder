package com.nbhv.thefinder.controller;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.nbhv.thefinder.dto.request.ClaimReportRequest;
import com.nbhv.thefinder.dto.response.ClaimReportResponse;
import com.nbhv.thefinder.entity.User;
import com.nbhv.thefinder.exception.UnauthorizedException;
import com.nbhv.thefinder.repo.UserRepo;
import com.nbhv.thefinder.service.ClaimReportService;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ClaimReportController {

    private final ClaimReportService claimReportService;
    private final UserRepo userRepo;

    @PostMapping(value = "/posts/{postId}/claims", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ClaimReportResponse> createClaim(
            @PathVariable Long postId,
            @Valid @RequestPart("request") ClaimReportRequest req,
            @RequestPart("files") List<MultipartFile> files,
            HttpSession session) {
        return ResponseEntity.ok(claimReportService.createClaim(postId, req, files, requireCurrentUser(session)));
    }

    @GetMapping("/claims/mine")
    public ResponseEntity<List<ClaimReportResponse>> getMyClaims(HttpSession session) {
        return ResponseEntity.ok(claimReportService.getMyClaims(requireCurrentUser(session)));
    }

    @GetMapping("/claims/received")
    public ResponseEntity<List<ClaimReportResponse>> getReceivedClaims(HttpSession session) {
        return ResponseEntity.ok(claimReportService.getReceivedClaims(requireCurrentUser(session)));
    }

    @PostMapping("/claims/{claimId}/images")
    public ResponseEntity<List<String>> uploadClaimImages(
            @PathVariable Long claimId,
            @RequestParam("files") List<MultipartFile> files,
            HttpSession session) {
        return ResponseEntity.ok(claimReportService.addImages(claimId, files, requireCurrentUser(session)));
    }

    @GetMapping("/posts/{postId}/claims")
    public ResponseEntity<List<ClaimReportResponse>> getClaimsByPost(
            @PathVariable Long postId,
            HttpSession session) {
        return ResponseEntity.ok(claimReportService.getClaimsByPost(postId, requireCurrentUser(session)));
    }

    @PostMapping("/claims/{claimId}/confirm")
    public ResponseEntity<ClaimReportResponse> confirmClaim(
            @PathVariable Long claimId,
            HttpSession session) {
        return ResponseEntity.ok(claimReportService.confirmClaim(claimId, requireCurrentUser(session)));
    }

    @PostMapping("/claims/{claimId}/review")
    public ResponseEntity<ClaimReportResponse> reviewClaim(
            @PathVariable Long claimId,
            HttpSession session) {
        return ResponseEntity.ok(claimReportService.reviewClaim(claimId, requireCurrentUser(session)));
    }

    @PostMapping("/claims/{claimId}/reject")
    public ResponseEntity<ClaimReportResponse> rejectClaim(
            @PathVariable Long claimId,
            HttpSession session) {
        return ResponseEntity.ok(claimReportService.rejectClaim(claimId, requireCurrentUser(session)));
    }

    @DeleteMapping("/claims/{claimId}")
    public ResponseEntity<Void> cancelClaim(
            @PathVariable Long claimId,
            HttpSession session) {
        claimReportService.cancelClaim(claimId, requireCurrentUser(session));
        return ResponseEntity.noContent().build();
    }

    private User requireCurrentUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new UnauthorizedException("Bạn cần đăng nhập để thực hiện thao tác này");
        }
        return userRepo.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Phiên đăng nhập không hợp lệ"));
    }
}
