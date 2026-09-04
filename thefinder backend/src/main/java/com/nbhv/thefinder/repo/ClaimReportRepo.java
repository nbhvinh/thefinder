package com.nbhv.thefinder.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.nbhv.thefinder.entity.ClaimReport;
import com.nbhv.thefinder.entity.enums.ClaimStatus;

public interface ClaimReportRepo extends JpaRepository<ClaimReport, Long> {

    List<ClaimReport> findByPostId(Long postId);

    List<ClaimReport> findByClaimantIdOrderByCreatedAtDesc(Long claimantId);

    List<ClaimReport> findByPostUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByPostIdAndClaimantIdAndStatusIn(
            Long postId, Long claimantId, List<ClaimStatus> statuses);

    @Modifying
    @Query("UPDATE ClaimReport c SET c.status = :rejectedStatus " +
           "WHERE c.post.id = :postId AND c.id <> :confirmedClaimId AND c.status = :pendingStatus")
    void rejectOtherClaims(@Param("postId") Long postId,
                           @Param("confirmedClaimId") Long confirmedClaimId,
                           @Param("pendingStatus") ClaimStatus pendingStatus,
                           @Param("rejectedStatus") ClaimStatus rejectedStatus);
}
