package com.nbhv.thefinder.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nbhv.thefinder.dto.request.ReportCreateRequest;
import com.nbhv.thefinder.dto.response.ReportResponse;
import com.nbhv.thefinder.entity.Post;
import com.nbhv.thefinder.entity.Report;
import com.nbhv.thefinder.entity.User;
import com.nbhv.thefinder.entity.enums.NotificationType;
import com.nbhv.thefinder.entity.enums.ReportStatus;
import com.nbhv.thefinder.entity.enums.UserRole;
import com.nbhv.thefinder.exception.ForbiddenException;
import com.nbhv.thefinder.exception.NotFoundException;
import com.nbhv.thefinder.repo.PostRepo;
import com.nbhv.thefinder.repo.ReportRepo;

@Service
public class ReportService {

    private final ReportRepo reportRepo;
    private final PostRepo postRepo;
    private final NotificationService notificationService;

    public ReportService(ReportRepo reportRepo, PostRepo postRepo, NotificationService notificationService) {
        this.reportRepo = reportRepo;
        this.postRepo = postRepo;
        this.notificationService = notificationService;
    }

    @Transactional
    public void createReport(Long postId, ReportCreateRequest req, User reporter) {
        if (reporter.isBlacklisted()) {
            throw new ForbiddenException("Account is blacklisted");
        }

        Post post = postRepo.findById(postId)
                .orElseThrow(() -> new NotFoundException("Post not found"));
        if (post.isHidden()) {
            throw new NotFoundException("Post not found");
        }
        if (post.getUser().getId().equals(reporter.getId())) {
            throw new IllegalStateException("Cannot report your own post");
        }
        if (reportRepo.existsByReporterIdAndPostId(reporter.getId(), postId)) {
            throw new IllegalStateException("You already reported this post");
        }

        Report report = new Report();
        report.setReporter(reporter);
        report.setPost(post);
        report.setReason(req.getReason());
        report.setDetail(req.getDetail());
        reportRepo.save(report);

        notificationService.send(
                reporter,
                NotificationType.REPORT_SUBMITTED,
                "Bạn đã report bài viết \"" + post.getTitle() + "\" thành công.",
                post);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> getPendingReports(User admin, Pageable pageable) {
        requireAdmin(admin);
        return reportRepo.findByStatusOrderByCreatedAtAsc(ReportStatus.PENDING, pageable)
                .map(ReportResponse::from);
    }

    @Transactional
    public void reviewReport(Long reportId, User admin) {
        requireAdmin(admin);
        Report report = reportRepo.findById(reportId)
                .orElseThrow(() -> new NotFoundException("Report not found"));
        if (report.getStatus() == ReportStatus.REVIEWED) {
            throw new IllegalStateException("Report already reviewed");
        }

        Post post = report.getPost();
        boolean newlyHidden = !post.isHidden();
        post.setHidden(true);
        reportRepo.findByPostIdAndStatus(post.getId(), ReportStatus.PENDING)
                .forEach(pendingReport -> pendingReport.setStatus(ReportStatus.REVIEWED));
        postRepo.save(post);

        if (newlyHidden) {
            notificationService.send(
                    post.getUser(),
                    NotificationType.POST_HIDDEN,
                    "Bài viết \"" + post.getTitle() + "\" của bạn đã bị ẩn do vi phạm.",
                    post);
        }
    }

    @Transactional
    public void dismissReport(Long reportId, User admin) {
        requireAdmin(admin);
        Report report = reportRepo.findById(reportId)
                .orElseThrow(() -> new NotFoundException("Report not found"));
        if (report.getStatus() != ReportStatus.PENDING) {
            throw new IllegalStateException("Report already reviewed");
        }
        report.setStatus(ReportStatus.DISMISSED);
        reportRepo.save(report);
    }

    private void requireAdmin(User user) {
        if (user.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Admin only");
        }
    }
}
