package com.nbhv.thefinder.repo;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.nbhv.thefinder.entity.Report;
import com.nbhv.thefinder.entity.enums.ReportStatus;

public interface ReportRepo extends JpaRepository<Report, Long> {
    boolean existsByReporterIdAndPostId(Long reporterId, Long postId);
    Page<Report> findByStatusOrderByCreatedAtAsc(ReportStatus status, Pageable pageable);
    List<Report> findByPostIdAndStatus(Long postId, ReportStatus status);
}
