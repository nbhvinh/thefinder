package com.nbhv.thefinder.repo;

import com.nbhv.thefinder.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryRepo extends JpaRepository<Category, Long> {
}