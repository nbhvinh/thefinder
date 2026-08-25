package com.nbhv.thefinder.repo;

import com.nbhv.thefinder.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserRepo extends JpaRepository<User, Long> {
   
}