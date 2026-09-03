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
import com.nbhv.thefinder.entity.enums.NotificationType;
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
    private final NotificationService notificationService;

    @Transactional
    public ClaimReportResponse createClaim(
            Long postId,
            ClaimReportRequest req,
            List<MultipartFile> files,
            User currentUser) {
        requireAuthenticatedUser(currentUser);

        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một ảnh minh chứng");
        }
        if (files.size() > 3) {
            throw new IllegalArgumentException("Tối đa 3 ảnh cho mỗi claim");
        }
        // Validate all files before writing anything, so one bad file cannot create a partial claim.
        files.forEach(imageStorageService::validate);

        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));

        if (post.isHidden()) {
            throw new NotFoundException("Post not found");
        }

        if (post.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Không thể tự claim bài đăng của chính mình");
        }
        if (post.getStatus() != PostStatus.OPEN) {
            throw new IllegalStateException("Post này không còn nhận claim");
        }
        if (claimRepo.existsByPostIdAndClaimantIdAndStatusIn(
                postId,
                currentUser.getId(),
                List.of(ClaimStatus.SUBMITTED, ClaimStatus.PENDING, ClaimStatus.REVIEWING, ClaimStatus.CONFIRMED))) {
            throw new IllegalStateException("Bạn đã gửi claim cho bài đăng này");
        }

        ClaimReport claim = new ClaimReport();
        claim.setPost(post);
        claim.setClaimant(currentUser);
        claim.setDescription(req.getDescription().trim());
        claim.setMeetTime(req.getMeetTime());
        claim.setMeetLocation(req.getMeetLocation().trim());
        claim.setStatus(ClaimStatus.SUBMITTED);

        List<String> storedUrls = new ArrayList<>();
        try {
            for (MultipartFile file : files) {
                String url = imageStorageService.store(file, "claims");
                storedUrls.add(url);

                ClaimImage image = new ClaimImage();
                image.setClaimReport(claim);
                image.setImageUrl(url);
                claim.getImages().add(image);
            }

            claimRepo.save(claim);
            notificationService.send(
                    post.getUser(),
                    NotificationType.CLAIM_RECEIVED,
                    currentUser.getFullName() + " đã gửi một đơn cho bài viết “" + post.getTitle() + "”.",
                    post);
            return toResponse(claim);
        } catch (RuntimeException ex) {
            storedUrls.forEach(imageStorageService::deleteStoredFile);
            throw ex;
        }
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
        if (claim.getStatus() != ClaimStatus.SUBMITTED) {
            throw new IllegalStateException("Không thể thêm ảnh vào claim đã được xử lý");
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

    @Transactional(readOnly = true)
    public List<ClaimReportResponse> getClaimsByPost(Long postId, User currentUser) {
        requireAuthenticatedUser(currentUser);
        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));
        if (!post.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Chỉ chủ post mới được xem danh sách claim");
        }
        return claimRepo.findByPostId(postId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClaimReportResponse> getMyClaims(User currentUser) {
        requireAuthenticatedUser(currentUser);
        return claimRepo.findByClaimantIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClaimReportResponse> getReceivedClaims(User currentUser) {
        requireAuthenticatedUser(currentUser);
        return claimRepo.findByPostUserIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClaimReportResponse reviewClaim(Long claimId, User currentUser) {
        requireAuthenticatedUser(currentUser);
        ClaimReport claim = getClaim(claimId);
        requirePostOwner(claim, currentUser, "Chỉ chủ post mới được nhận xử lý claim");
        if (claim.getStatus() != ClaimStatus.SUBMITTED) {
            throw new IllegalStateException("Chỉ có thể nhận xử lý claim mới gửi");
        }
        if (claim.getPost().getStatus() != PostStatus.OPEN) {
            throw new IllegalStateException("Post này không còn nhận xử lý claim");
        }
        claim.setStatus(ClaimStatus.PENDING);
        ClaimReport saved = claimRepo.save(claim);
        notificationService.send(
                claim.getClaimant(),
                NotificationType.CLAIM_REVIEWING,
                "Đơn của bạn cho bài viết “" + claim.getPost().getTitle() + "” đang được kiểm tra.",
                claim.getPost());
        return toResponse(saved);
    }

    @Transactional
    public ClaimReportResponse rejectClaim(Long claimId, User currentUser) {
        requireAuthenticatedUser(currentUser);
        ClaimReport claim = getClaim(claimId);
        requirePostOwner(claim, currentUser, "Chỉ chủ post mới được từ chối claim");
        if (!isActive(claim.getStatus())) {
            throw new IllegalStateException("Chỉ có thể từ chối claim chưa hoàn tất");
        }
        claim.setStatus(ClaimStatus.REJECTED);
        ClaimReport saved = claimRepo.save(claim);
        notificationService.send(
                claim.getClaimant(),
                NotificationType.CLAIM_REJECTED,
                "Đơn của bạn cho bài viết “" + claim.getPost().getTitle() + "” đã bị từ chối.",
                claim.getPost());
        return toResponse(saved);
    }

    @Transactional
    public void cancelClaim(Long claimId, User currentUser) {
        requireAuthenticatedUser(currentUser);
        ClaimReport claim = getClaim(claimId);
        if (!claim.getClaimant().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Chỉ người tạo claim mới được hủy claim");
        }
        if (!isActive(claim.getStatus())) {
            throw new IllegalStateException("Chỉ có thể hủy claim chưa hoàn tất");
        }
        notificationService.send(
                claim.getPost().getUser(),
                NotificationType.CLAIM_CANCELLED,
                currentUser.getFullName() + " đã hủy đơn cho bài viết “" + claim.getPost().getTitle() + "”.",
                claim.getPost());
        claimRepo.delete(claim);
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
        if (claim.getStatus() != ClaimStatus.PENDING && claim.getStatus() != ClaimStatus.REVIEWING) {
            throw new IllegalStateException("Claim phải được nhận kiểm tra trước khi hoàn tất");
        }

        List<ClaimReport> otherActiveClaims = claimRepo.findByPostId(post.getId()).stream()
                .filter(other -> !other.getId().equals(claim.getId()) && isActive(other.getStatus()))
                .toList();
        claim.setStatus(ClaimStatus.CONFIRMED);
        claimRepo.save(claim);

        claimRepo.rejectOtherClaims(
                post.getId(),
                claim.getId(),
                ClaimStatus.SUBMITTED,
                ClaimStatus.REJECTED);
        claimRepo.rejectOtherClaims(
                post.getId(),
                claim.getId(),
                ClaimStatus.PENDING,
                ClaimStatus.REJECTED);
        claimRepo.rejectOtherClaims(
                post.getId(),
                claim.getId(),
                ClaimStatus.REVIEWING,
                ClaimStatus.REJECTED);

        post.setStatus(PostStatus.RESOLVED);
        postRepo.save(post);

        notificationService.send(
                claim.getClaimant(),
                NotificationType.CLAIM_CONFIRMED,
                "Đơn của bạn cho bài viết “" + post.getTitle() + "” đã được xác nhận thành công.",
                post);
        for (ClaimReport other : otherActiveClaims) {
            notificationService.send(
                    other.getClaimant(),
                    NotificationType.CLAIM_REJECTED,
                    "Bài viết “" + post.getTitle() + "” đã được giải quyết bằng một đơn khác.",
                    post);
        }

        return toResponse(claim);
    }

    private ClaimReport getClaim(Long claimId) {
        return claimRepo.findById(claimId)
                .orElseThrow(() -> new NotFoundException("Claim not found"));
    }

    private void requirePostOwner(ClaimReport claim, User currentUser, String message) {
        if (!claim.getPost().getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException(message);
        }
    }

    private boolean isActive(ClaimStatus status) {
        return status == ClaimStatus.SUBMITTED || status == ClaimStatus.PENDING || status == ClaimStatus.REVIEWING;
    }

    private void requireAuthenticatedUser(User currentUser) {
        if (currentUser == null || currentUser.getId() == null) {
            throw new ForbiddenException("Bạn cần đăng nhập để thực hiện thao tác này");
        }
    }
}
