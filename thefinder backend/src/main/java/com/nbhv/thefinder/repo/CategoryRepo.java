package com.nbhv.thefinder.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.nbhv.thefinder.entity.Category;

public interface CategoryRepo extends JpaRepository<Category, Long> {

}