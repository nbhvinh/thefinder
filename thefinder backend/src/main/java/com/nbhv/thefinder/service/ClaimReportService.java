package com.nbhv.thefinder.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.nbhv.thefinder.dto.request.ClaimReportRequest;
import com.nbhv.thefinder.dto.response.ClaimReportResponse;
import com.nbhv.thefinder.entity.ClaimImage;
import com.nbhv.thefinder.entity.ClaimReport;
import com.nbhv.thefinder.entity.Post;
import com.nbhv.thefinder.entity.User;
import com.nbhv.thefinder.entity.enums.ClaimStatus;
import com.nbhv.thefinder.entity.enums.PostStatus;
import com.nbhv.thefinder.exception.ForbiddenException;
import com.nbhv.thefinder.exception.NotFoundException;
import com.nbhv.thefinder.repo.ClaimReportRepo;
import com.nbhv.thefinder.repo.PostRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClaimReportService {

    private final ClaimReportRepo claimRepo;
    private final PostRepo postRepo;
    private final ImageStorageService imageStorageService;

    @Transactional
    public ClaimReportResponse createClaim(Long postId, ClaimReportRequest req, User currentUser) {
        requireAuthenticatedUser(currentUser);

        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        if (post.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Không thể tự claim bài đăng của chính mình");
        }
        if (post.getStatus() != PostStatus.OPEN) {
            throw new IllegalStateException("Post này không còn nhận claim");
        }
        if (claimRepo.existsByPostIdAndClaimantIdAndStatusIn(
                postId,
                currentUser.getId(),
                List.of(ClaimStatus.SUBMITTED, ClaimStatus.PENDING, ClaimStatus.REVIEWING))) {
            throw new IllegalStateException("Bạn đã có claim đang chờ xử lý cho post này");
        }

        ClaimReport claim = new ClaimReport();
        claim.setPost(post);
        claim.setClaimant(currentUser);
        claim.setDescription(req.getDescription());
        claim.setMeetTime(req.getMeetTime());
        claim.setMeetLocation(req.getMeetLocation());
        claim.setStatus(ClaimStatus.PENDING);

        claimRepo.save(claim);
        return toResponse(claim);
    }

    @Transactional
    public List<String> addImages(Long claimId, List<MultipartFile> files, User currentUser) {
        requireAuthenticatedUser(currentUser);
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một ảnh");
        }
        if (files.stream().anyMatch(file -> file == null || file.isEmpty())) {
            throw new IllegalArgumentException("Danh sách upload chứa ảnh rỗng");
        }

        ClaimReport claim = claimRepo.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        if (!claim.getClaimant().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Chỉ người tạo claim mới được upload ảnh");
        }

        int existingCount = claim.getImages().size();
        if (existingCount + files.size() > 3) {
            throw new IllegalStateException("Tối đa 3 ảnh cho mỗi claim");
        }

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            String url = imageStorageService.store(file, "claims");
            ClaimImage image = new ClaimImage();
            image.setClaimReport(claim);
            image.setImageUrl(url);
            claim.getImages().add(image);
            urls.add(url);
        }

        claimRepo.save(claim);
        return urls;
    }

    private ClaimReportResponse toResponse(ClaimReport c) {
        ClaimReportResponse res = new ClaimReportResponse();
        res.setId(c.getId());
        res.setPostId(c.getPost().getId());
        res.setPostTitle(c.getPost().getTitle());
        res.setPostType(c.getPost().getType());
        res.setPostStatus(c.getPost().getStatus());
        res.setClaimantId(c.getClaimant().getId());
        res.setClaimantName(c.getClaimant().getFullName());
        res.setClaimantUsername(c.getClaimant().getFullName());
        res.setDescription(c.getDescription());
        res.setMeetTime(c.getMeetTime());
        res.setMeetLocation(c.getMeetLocation());
        res.setStatus(c.getStatus());
        res.setCreatedAt(c.getCreatedAt());
        res.setImageUrls(c.getImages().stream()
                .map(img -> img.getImageUrl())
                .collect(Collectors.toList()));
        return res;
    }

    @Transactional
    public ClaimReportResponse confirmClaim(Long claimId, User currentUser) {
        requireAuthenticatedUser(currentUser);

        ClaimReport claim = claimRepo.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));

        Post post = claim.getPost();

        if (!post.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Chỉ chủ post mới được confirm claim");
        }
        if (post.getStatus() != PostStatus.OPEN) {
            throw new IllegalStateException("Post này không còn ở trạng thái mở");
        }
        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new IllegalStateException("Claim này không còn ở trạng thái chờ xử lý");
        }

        claim.setStatus(ClaimStatus.CONFIRMED);
        claimRepo.save(claim);

        claimRepo.rejectOtherClaims(
                post.getId(),
                claim.getId(),
                ClaimStatus.PENDING,
                ClaimStatus.REJECTED);

        post.setStatus(PostStatus.RESOLVED);
        postRepo.save(post);

        return toResponse(claim);
    }

    private void requireAuthenticatedUser(User currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new ForbiddenException("Bạn cần đăng nhập để thực hiện thao tác này");
        }
    }
}
