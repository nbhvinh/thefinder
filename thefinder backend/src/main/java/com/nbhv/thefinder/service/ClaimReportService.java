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
    public ClaimReportResponse createClaim(
            Long postId, ClaimReportRequest req, List<MultipartFile> files, User currentUser) {
        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        if (post.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Không thể tự claim bài đăng của chính mình");
        }
        if (post.getStatus() != PostStatus.OPEN) {
            throw new IllegalStateException("Post này không còn nhận claim");
        }
        if (claimRepo.existsByPostIdAndClaimantIdAndStatusIn(
                postId, currentUser.getId(),
                List.of(ClaimStatus.SUBMITTED, ClaimStatus.PENDING, ClaimStatus.REVIEWING, ClaimStatus.CONFIRMED))) {
            throw new IllegalStateException("Bạn đã gửi claim cho bài đăng này");
        }
        validateClaimImages(files);

        ClaimReport claim = new ClaimReport();
        claim.setPost(post);
        claim.setClaimant(currentUser);
        claim.setDescription(req.getDescription().trim());
        claim.setMeetTime(req.getMeetTime());
        claim.setMeetLocation(req.getMeetLocation().trim());
        claim.setStatus(ClaimStatus.SUBMITTED);

        for (MultipartFile file : files) {
            ClaimImage image = new ClaimImage();
            image.setClaimReport(claim);
            image.setImageUrl(imageStorageService.store(file, "claims"));
            claim.getImages().add(image);
        }
        claimRepo.save(claim);
        return toResponse(claim);
    }

    @Transactional
    public ClaimReportResponse reviewClaim(Long claimId, User currentUser) {
        ClaimReport claim = getClaim(claimId);
        if (!claim.getPost().getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Chỉ chủ post mới được nhận xử lý claim");
        }
        if (claim.getStatus() != ClaimStatus.SUBMITTED) {
            throw new IllegalStateException("Chỉ có thể nhận xử lý claim mới gửi");
        }
        if (claim.getPost().getStatus() != PostStatus.OPEN) {
            throw new IllegalStateException("Post này không còn nhận xử lý claim");
        }
        claim.setStatus(ClaimStatus.PENDING);
        return toResponse(claimRepo.save(claim));
    }

    @Transactional
    public ClaimReportResponse confirmClaim(Long claimId, User currentUser) {
        ClaimReport claim = claimRepo.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));
        Post post = claim.getPost();

        if (!post.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Chỉ chủ post mới được confirm claim");
        }
        if (claim.getStatus() != ClaimStatus.PENDING && claim.getStatus() != ClaimStatus.REVIEWING) {
            throw new IllegalStateException("Claim phải được nhận kiểm tra trước khi hoàn tất");
        }
        if (post.getStatus() != PostStatus.OPEN) {
            throw new IllegalStateException("Post này không còn nhận confirm claim");
        }

        claim.setStatus(ClaimStatus.CONFIRMED);
        post.setStatus(PostStatus.RESOLVED);
        claimRepo.rejectOtherClaims(post.getId(), claim.getId(), ClaimStatus.SUBMITTED, ClaimStatus.REJECTED);
        claimRepo.rejectOtherClaims(post.getId(), claim.getId(), ClaimStatus.PENDING, ClaimStatus.REJECTED);
        claimRepo.rejectOtherClaims(post.getId(), claim.getId(), ClaimStatus.REVIEWING, ClaimStatus.REJECTED);
        claimRepo.save(claim);
        postRepo.save(post);

        return toResponse(claim);
    }

    @Transactional(readOnly = true)
    public List<ClaimReportResponse> getClaimsByPost(Long postId, User currentUser) {
        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        if (!post.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Chỉ chủ post mới được xem danh sách claim");
        }

        return claimRepo.findByPostId(postId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClaimReportResponse> getMyClaims(User currentUser) {
        return claimRepo.findByClaimantIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClaimReportResponse> getReceivedClaims(User currentUser) {
        return claimRepo.findByPostUserIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClaimReportResponse rejectClaim(Long claimId, User currentUser) {
        ClaimReport claim = getClaim(claimId);
        if (!claim.getPost().getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Chỉ chủ post mới được từ chối claim");
        }
        if (claim.getStatus() != ClaimStatus.SUBMITTED && claim.getStatus() != ClaimStatus.PENDING
                && claim.getStatus() != ClaimStatus.REVIEWING) {
            throw new IllegalStateException("Chỉ có thể từ chối claim chưa hoàn tất");
        }
        claim.setStatus(ClaimStatus.REJECTED);
        return toResponse(claimRepo.save(claim));
    }

    @Transactional
    public void cancelClaim(Long claimId, User currentUser) {
        ClaimReport claim = getClaim(claimId);
        if (!claim.getClaimant().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Chỉ người tạo claim mới được hủy claim");
        }
        if (claim.getStatus() != ClaimStatus.SUBMITTED && claim.getStatus() != ClaimStatus.PENDING
                && claim.getStatus() != ClaimStatus.REVIEWING) {
            throw new IllegalStateException("Chỉ có thể hủy claim chưa hoàn tất");
        }
        claimRepo.delete(claim);
    }

    @Transactional
    public List<String> addImages(Long claimId, List<MultipartFile> files, User currentUser) {
        ClaimReport claim = getClaim(claimId);

        if (!claim.getClaimant().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Chỉ người tạo claim mới được upload ảnh");
        }
        if (claim.getStatus() != ClaimStatus.SUBMITTED) {
            throw new IllegalStateException("Không thể thêm ảnh vào claim đã được xử lý");
        }
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Cần chọn ít nhất một ảnh");
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

    private ClaimReport getClaim(Long claimId) {
        return claimRepo.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));
    }

    private void validateClaimImages(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Cần ít nhất một ảnh minh chứng");
        }
        if (files.size() > 3) {
            throw new IllegalArgumentException("Tối đa 3 ảnh cho mỗi claim");
        }
        files.forEach(imageStorageService::validate);
    }
}
