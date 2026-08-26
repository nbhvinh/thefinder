package com.nbhv.thefinder.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nbhv.thefinder.entity.User;

public interface UserRepo extends JpaRepository<User, Long> {
   Optional<User> findByEmail(String email);
   boolean existsByEmail(String email);

}