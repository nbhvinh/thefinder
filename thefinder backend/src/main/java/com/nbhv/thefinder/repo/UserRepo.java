package com.nbhv.thefinder.repo;

import java.util.Optional;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.nbhv.thefinder.entity.User;

public interface UserRepo extends JpaRepository<User, Long> {
   Optional<User> findByEmail(String email);
   boolean existsByEmail(String email);
   List<User> findTop8ByFullNameContainingIgnoreCaseAndBlacklistedFalseOrderByFullNameAsc(String query);

   @Query("""
           SELECT u FROM User u
           WHERE u.blacklisted = false
             AND u.role = com.nbhv.thefinder.entity.enums.UserRole.USER
             AND u.id <> :adminId
             AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))
           ORDER BY u.fullName ASC
           """)
   List<User> searchBlacklistCandidates(
           @Param("query") String query,
           @Param("adminId") Long adminId,
           Pageable pageable);

   List<User> findByBlacklistedTrueOrderByFullNameAsc(Pageable pageable);

}
