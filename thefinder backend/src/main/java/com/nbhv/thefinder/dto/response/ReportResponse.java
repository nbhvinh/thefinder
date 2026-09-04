package com.nbhv.thefinder.dto.response;

import java.time.OffsetDateTime;

import com.nbhv.thefinder.entity.Report;
import com.nbhv.thefinder.entity.enums.ReportReason;
import com.nbhv.thefinder.entity.enums.ReportStatus;

import lombok.Getter;

@Getter
public class ReportResponse {
    private Long id;
    private Long reporterId;
    private String reporterName;
    private Long postId;
    private String postTitle;
    private Long postOwnerId;
    private ReportReason reason;
    private String detail;
    private ReportStatus status;
    private OffsetDateTime createdAt;

    public static ReportResponse from(Report report) {
        ReportResponse response = new ReportResponse();
        response.id = report.getId();
        response.reporterId = report.getReporter().getId();
        response.reporterName = report.getReporter().getFullName();
        response.postId = report.getPost().getId();
        response.postTitle = report.getPost().getTitle();
        response.postOwnerId = report.getPost().getUser().getId();
        response.reason = report.getReason();
        response.detail = report.getDetail();
        response.status = report.getStatus();
        response.createdAt = report.getCreatedAt();
        return response;
    }
}
