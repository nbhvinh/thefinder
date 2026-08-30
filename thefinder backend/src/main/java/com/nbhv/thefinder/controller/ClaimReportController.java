package com.nbhv.thefinder.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.nbhv.thefinder.dto.request.ClaimReportRequest;
import com.nbhv.thefinder.dto.response.ClaimReportResponse;
import com.nbhv.thefinder.entity.User;
import com.nbhv.thefinder.service.ClaimReportService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ClaimReportController {

    private final ClaimReportService claimReportService;

    @PostMapping("/posts/{postId}/claims")
    public ResponseEntity<ClaimReportResponse> createClaim(
            @PathVariable Long postId,
            @Valid @RequestBody ClaimReportRequest req,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(claimReportService.createClaim(postId, req, currentUser));
    }

    @PostMapping("/claims/{claimId}/images")
    public ResponseEntity<List<String>> uploadClaimImages(
            @PathVariable Long claimId,
            @RequestParam("files") List<MultipartFile> files,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(claimReportService.addImages(claimId, files, currentUser));
    }

    @PostMapping("/claims/{claimId}/confirm")
    public ResponseEntity<ClaimReportResponse> confirmClaim(
            @PathVariable Long claimId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(claimReportService.confirmClaim(claimId, currentUser));
    }
}
